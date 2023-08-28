import { DatePicker, Select, InputWithLabel } from '../components/InputWithLabel';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import style from '../assets/style.json';
import { useState, useEffect } from 'react';
import CheckBox from 'expo-checkbox'
import { StackActions, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Padding from '../components/Padding';
import { getDatabase, update, ref, set, push, get, query, limitToFirst, remove, onValue, orderByChild, startAt, endAt } from 'firebase/database';
import firebase from '../services/firebaseConfig';
import { getAuth, signOut } from 'firebase/auth';
import { AntDesign } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
const db = getDatabase(firebase);

async function change(props) {
    switch (props.url) {
        case 'mps':
            props.data.dataCompra = props.data.dataCompra.getTime();
            props.data.validade = props.data.validade.getTime();
            break;
        case 'produtos':
            let snapshot = await get(ref(db, `data/${getAuth().currentUser.uid}/forms/${props.data.formulacao}`));
            let data = snapshot.val();
            let materiasPrimas = data.materiasprimas;

            const response = await fetch('https://controle-produtos.onrender.com/firebaseApi/checkForm?uid=' + getAuth().currentUser.uid,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ materiasPrimas: Object.values(materiasPrimas) })
                });
            const json = await response.json();
            if (json.error) {
                Alert.alert('Erro ao salvar', json.msg);
                return false;
            }

            props.data.data = props.data.data.getTime();
            props.data.validade = props.data.validade.getTime();
            break;
        default:
            break;
    }

    const value = await AsyncStorage.getItem('user')
    const user = JSON.parse(value);
    const uid = user.uid;
    if (uid !== getAuth().currentUser.uid) {
        Alert.alert('Erro', 'Houve um erro com sua autenticação\nPor favor, faça login novamente');
        signOut(getAuth());
        useNavigation().dispatch(StackActions.popToTop());
        return false;
    }
    try {
        const nodeRef = props.set == 'set' ?
            push(ref(db, `data/${uid}/${props.url}`)) :
            ref(db, `data/${uid}/${props.url}/${props.data._id}`);
        //if (props.set === 'set') {
        //const url = ref(db, `data/${uid}/${props.url}`)
        //const nodeRef = push(url);
        const data = props.url === 'mps' ?
            {
                ...props.data,
                _id: nodeRef.key,
                comprado: props.data.quantidade
            } :
            {
                ...props.data,
                _id: nodeRef.key,
            }
        if (props.url === 'produtos') {
            let response = await fetch('https://controle-produtos.onrender.com/firebaseApi/checkForm?id=' + uid);
            let json = await response.json();
            if (response.status !== 200) {
                Alert.alert('Erro', 'Erro ao conectar com o servidor');
                console.error(json.msg);
                return false;
            }
            if (json.error) {
                Alert.alert('Erro', 'Erro ao salvar os dados');
                console.error(json.msg);
                return false;
            }

        }
        await update(nodeRef, data)
        if (props.url === 'mps') {
            //adicionar a saida no banco de dados
            //para ser utilizado no Faturamento
            const dataCompra = new Date(props.data.dataCompra);
            const ano = dataCompra.getFullYear();
            const mes = dataCompra.getMonth() + 1;
            const id = new Date().getTime();
            await update(ref(db, `data/${uid}/faturamento/saidas/${id}`), {
                _id: id,
                data: {
                    mes: mes,
                    ano: ano,
                },
                idProduto: nodeRef.key,
                valor: parseFloat(props.data.preco),
            })
        }
        else if (props.url === 'vendas') {
            //adicionar a entrada no banco de dados
            //para ser utilizado no Faturamento
            if (!props.data.naoVenda) {
                const dataVenda = new Date();
                const ano = dataVenda.getFullYear();
                const mes = dataVenda.getMonth() + 1;
                const id = dataVenda.getTime();
                await update(ref(db, `data/${uid}/faturamento/entradas/${id}`), {
                    _id: id,
                    idVenda: nodeRef.key,
                    data: {
                        mes: mes,
                        ano: ano,
                    },
                    valor: parseFloat(props.data.preco),
                })
            }
            const produtos = props.data.produtos;
            //atualizar estoque de produtos
            for (let i = 0; i < produtos.length; i++) {
                const item = produtos[i];
                const id = item[0];
                const quantidade = item[1].quantidade
                const snapshot = await get(ref(db, `data/${uid}/produtos/${id}`))
                const data = snapshot.val();
                const estoque = data.quantidade;
                const novoEstoque = (estoque - quantidade);
                if (novoEstoque < 0) {
                    Alert.alert('Erro', 'Quantidade de ' + data.nome + ' insuficiente no estoque');
                    return false;
                }
                update(ref(db, `data/${uid}/produtos/${id}`), {
                    quantidade: novoEstoque
                })
                if (novoEstoque == 0) {
                    update(ref(db, `data/${uid}/avisos`), {
                        noProd: true
                    })
                }
            }
        }
        if (props.url === 'produtos') {
            //reduzir o estoque de materias primas
            const formulacao = props.data.formulacao;
            const snapshot = await get(ref(db, `data/${uid}/forms/${formulacao}`))
            const data = snapshot.val();
            const materiasPrimas = data.materiasprimas;
            console.log(materiasPrimas)
            for (let i = 0; i < materiasPrimas.length; i++) {
                const item = materiasPrimas[i];
                const id = item[0];
                const quantidade = typeof item[1].quantidade === 'number' ?
                    item[1].quantidade :
                    parseFloat(item[1].quantidade);

                const snapshot = await get(ref(db, `data/${uid}/mps/${id}`))
                const data = snapshot.val();
                const estoque = data.quantidade;
                const novoEstoque = (estoque - quantidade);
                if (novoEstoque < 0) {
                    Alert.alert('Erro', 'Quantidade de ' + data.nome + ' insuficiente no estoque');
                    return false;
                }
                await update(ref(db, `data/${uid}/mps/${id}`), {
                    quantidade: novoEstoque
                }) //atualizando estoque
                if (novoEstoque <= 0) {
                    await update(ref(db, `data/${uid}/avisos`), {
                        noMps: true
                    })
                }
            }
            //  }
        }
        //else if (props.set === 'update') {} //Não foi possível implementar a atualização dos dados
    }
    catch (e) {
        Alert.alert('Erro', 'Erro ao salvar os dados');
        console.error(e);
        return false;
    }
    return true;
}

function getIndexString(index) {
    Enumerator = {
        nome: 'Nome:',
        dataCompra: 'Data de Compra:',
        validade: 'Validade:',
        quantidade: 'Quantidade:',
        unMedida: 'Unidade de Medida:',
        preco: 'Preço: R$',
        fornecedor: 'Fornecedor:',
        precoUn: 'Preço por Unidade: R$'
    }
    return Enumerator[index];
}

const CadMateriasPrimas = () => {
    const Verificar = (props) => {
        const [isLoading, setIsLoading] = useState(false);
        const data = props.data;
        const content = props.content || 'Verificar';

        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
            >
                <View style={style.modalShade}>
                    <View
                        style={style.modal}
                    >
                        <View style={style.modalHeader}>
                            <Text style={style.mainText}>{content}</Text>
                        </View>

                        <FlatList
                            data={Object.entries(data)}
                            renderItem={({ item }) => <Text style={style.text}>
                                {typeof item[1] === 'object' ?
                                    getIndexString(item[0]) + item[1].toLocaleDateString('pt-BR') :
                                    getIndexString(item[0]) + item[1]
                                }</Text>}
                            keyExtractor={(item, index) => index.toString()}
                            ListFooterComponent={isLoading ? <ActivityIndicator /> : null}
                        />
                        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-around' }}>
                            <TouchableOpacity style={style.button}
                                onPress={() => {
                                    change({ data: data, url: 'mps', set: 'set' })
                                    navigation.replace('Matérias-Primas');
                                    setModalVisible(!modalVisible);
                                }}
                            >
                                <Text style={style.textButton}>Salvar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{
                                ...style.button,
                                backgroundColor: 'gray'
                            }}
                                onPress={() => {
                                    setModalVisible(!modalVisible);
                                }}
                            >
                                <Text style={style.text_white} >Voltar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }
    const navigation = useNavigation();
    const [modalVisible, setModalVisible] = useState(false);
    const [nome, setNome] = useState('');
    const [dataCompra, setDataCompra] = useState(null)
    const [validade, setValidade] = useState(null)
    const [qtd, setQtd] = useState('');
    const [unMedida, setUnMedida] = useState('');
    const [preco, setPreco] = useState('');
    const [precoUn, setPrecoUn] = useState(0);
    const [fornecedor, setFornecedor] = useState('');

    useEffect(() => {
        try {
            if (preco / qtd == Infinity || isNaN(preco / qtd)) {
                setPrecoUn(0);
            } else {
                setPrecoUn(preco / qtd);
            }
        }
        catch {
            setPrecoUn(0);
        }
    }, [preco, qtd]);


    return (
        <ScrollView style={style.container}>
            {modalVisible ?
                <Verificar
                    data={{
                        nome: nome,
                        dataCompra: dataCompra,
                        validade: validade,
                        quantidade: parseFloat(qtd),
                        unMedida: unMedida,
                        preco: parseFloat(preco),
                        fornecedor: fornecedor,
                        precoUn: parseFloat(precoUn.toFixed(3))
                    }}
                    content={'Verificar Dados'}
                    parent={'Matérias-Primas'}
                    navigation={navigation}
                    modalVisible={!modalVisible}

                /> : null}
            <InputWithLabel value={nome} onChangeText={text => setNome(text)} label="Nome" />
            <DatePicker date={dataCompra} label="Data da Compra"
                onChange={(e, d) => {
                    setDataCompra(d)
                }} />
            <DatePicker label="Validade" date={validade}
                onChange={(e, d) => {
                    setValidade(d);
                }}
            />
            <InputWithLabel keyboardType="numeric" value={qtd} onChangeText={text => setQtd(text)} label="Quantidade" type="numeric" />
            <Select
                onValueChange={v => setUnMedida(v)}
                value={unMedida}
                label="Unidade de Medida"
                items={[
                    { label: 'Kilogramas - Kg', value: 'Kg' },
                    { label: 'Gramas - g', value: 'g' },
                    { label: 'Miligramas - mg', value: 'mg' },
                    { label: 'Litros - L', value: 'L' },
                    { label: 'Mililitros - ml', value: 'ml' },
                    { label: 'Unidade - un', value: 'un' },
                ]}
            />
            <InputWithLabel value={fornecedor} onChangeText={text => setFornecedor(text)} label="Fornecedor" />
            <InputWithLabel keyboardType="numeric" value={preco} onChangeText={t => setPreco(t)} label="Preço" type="numeric" />
            <Text style={{ fontSize: 20, margin: 5 }}>Preço Unitário: R${precoUn.toFixed(2)}/{unMedida}</Text>
            <View style={{ justifyContent: 'space-around', flexDirection: 'row' }}>
                <TouchableOpacity
                    style={style.button}
                    onPress={() => {
                        if (nome == '' || dataCompra == null || validade == null || qtd == 0 || unMedida == '' || preco == 0) {
                            Alert.alert('Erro', 'Preencha todos os campos!');
                            return;
                        }
                        setModalVisible(true);
                    }}
                >

                    <Text style={style.textButton}>Verificar</Text>
                </TouchableOpacity>
            </View>
            <Padding />
        </ScrollView>
    )
}

const CadFormulacoes = () => {
    const [data, setData] = useState([]);
    const [materiasPrimas, setMateriasPrimas] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [numberPages, setNumberPages] = useState(1);
    const [actualPage, setActualPage] = useState(1);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalOptionsVisible, setModalOptionsVisible] = useState(false);
    const [formId, setFormId] = useState(null);
    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState('');
    const [clicked, setClicked] = useState(false);
    const navigation = useNavigation();
    navigation.addListener('blur', () => {
        remove(ref(db, `data/${getAuth().currentUser.uid}/temp/form/${formId}/`));
        //remover cache do bd
    });

    const Verificar = () => { //Modal de verificação dos dados
        const [custo, setCusto] = useState(0);
        let preco = 0;
        useEffect(() => {
            Object.values(materiasPrimas).forEach((item) => {
                preco += item.custo;
            });
            setCusto(preco);
        }, []);

        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}>
                <View style={style.modalShade}>

                    <View style={style.modal}>
                        <View style={style.modalHeader}>
                            <Text style={style.mainText}>Verificar Dados</Text>
                        </View>
                        <Text style={style.text}>Nome:{nome} </Text>
                        <Text style={style.text}>Tipo: {tipo}</Text>
                        <Text style={style.text}>Custo: R${custo.toFixed(2)}</Text>
                        <Text style={style.text}>Matérias-primas: </Text>
                        <FlatList
                            style={{ marginTop: 5, borderTopColor: style.table.borderColor, borderTopWidth: style.table.borderWidth }}
                            data={Object.values(materiasPrimas)}
                            renderItem={({ item }) => <Text style={{ fontSize: 18 }} key={item._id}>{item.nome}: {item.quantidade}{item.unMedida}</Text>}
                            keyExtractor={item => item.id}
                            ListFooterComponent={isLoading ? <ActivityIndicator /> : null}
                        />
                        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-around' }}>
                            <TouchableOpacity style={style.button}
                                disabled={clicked}
                                onPress={async () => {
                                    setClicked(true);
                                    let ok = await change({ data: { nome: nome, tipo: tipo, custo: custo.toFixed(3), materiasprimas: { ...materiasPrimas }, }, url: 'forms', set: 'set' })
                                    if (!ok) {
                                        Alert.alert('Erro', 'Erro ao salvar os dados');
                                        return;
                                    }
                                    setModalVisible(!modalVisible);
                                    navigation.replace('Formulações');
                                }}>
                                <Text style={style.textButton}>
                                    {
                                        clicked ? <ActivityIndicator size={18} color='black' /> : 'Salvar'
                                    }
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{
                                ...style.button,
                                backgroundColor: 'gray'
                            }}
                                onPress={() => {
                                    setModalVisible(false);
                                }}
                            >
                                <Text style={style.text_white}>Voltar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }

    const getItens = (page) => {
        if (page === 0 || page > numberPages) return;
        const p = page ?? 1;
        setIsLoading(true);
        setActualPage(p);
        get(ref(db, `data/${getAuth().currentUser.uid}/mps`)).then((snapshot) => {
            setNumberPages(Math.ceil(snapshot.size / 10));
        });

        const dbRef = ref(db, `data/${getAuth().currentUser.uid}/mps`);
        const query_ = query(dbRef, limitToFirst(p * 10));
        get(query_).then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const keys = Object.keys(data);
                const array = keys.map((key) => {
                    return { ...data[key], id: key };
                });
                if (snapshot.size > 10) {
                    setData(array.slice((p - 1) * 10, snapshot.size))
                }
                else setData(array);
            }
        }).catch((error) => {
            console.error(error);
        }).finally(() => {
            setIsLoading(false);
        });
    };

    useEffect(() => {
        push(ref(db, `data/${getAuth().currentUser.uid}/temp/form`)).then((snapshot) => {
            setFormId(snapshot.key); //seta o id da formulação para utilizar no cache
            set(ref(db, `data/${getAuth().currentUser.uid}/temp/form/${snapshot.key}`), { empty: true });
        });
        getItens();
    }, []);

    const SearchItem = (props) => { //Renderiza um item da lista
        const item = props.item
        const [isOpen, setIsOpen] = useState(false);
        const [quantidade, setQuantidade] = useState('');
        const cache = ({ item }) => {
            let qtd = parseFloat(quantidade);
            if (qtd === 0) {
                set(ref(db, `data/${getAuth().currentUser.uid}/temp/form/${formId}/${item.id}`), null)
                get(ref(db, `data/${getAuth().currentUser.uid}/temp/form/${formId}/`)).then((snapshot) => {
                    setMateriasPrimas(snapshot.val());
                });
                return;
            }
            const custo = item.preco * qtd;
            set(ref(db, `data/${getAuth().currentUser.uid}/temp/form/${formId}/empty`), null)
            update(ref(db, `data/${getAuth().currentUser.uid}/temp/form/${formId}/${item.id}`), {
                id: item.id,
                quantidade: item.quantidade,
                nome: item.nome,
                unMedida: item.unMedida,
                custo: custo
            })
            get(ref(db, `data/${getAuth().currentUser.uid}/temp/form/${formId}/`)).then((snapshot) => {
                setMateriasPrimas(snapshot.val());
            });
        }

        return (
            <View>
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    marginTop: 5,

                    padding: style.table.padding,
                    borderColor: style.table.borderColor,
                    borderWidth: style.table.borderWidth,

                }}>
                    <CheckBox
                        disabled={false}
                        value={isOpen}
                        onValueChange={(newValue) => {
                            if (!newValue) {
                                remove(ref(db, `data/${getAuth().currentUser.uid}/temp/form/${formId}/${item.id}`));
                            }
                            setIsOpen(newValue)
                        }}
                    />
                    <Text style={{ fontSize: 20, marginLeft: 5 }}>{item.nome} - R$ {item.precoUn}/{item.unMedida}</Text>
                </View>
                {isOpen ? <>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'flex-end',
                        borderColor: style.table.borderColor,
                        borderWidth: style.table.borderWidth,
                        borderTopColor: 'transparent',
                    }}>
                        <InputWithLabel
                            value={quantidade}
                            onChangeText={t => {
                                setQuantidade(t)
                            }}
                            placeholder="Quantidade"
                            label={`${item.quantidade}${item.unMedida} em Estoque`} type="numeric" />
                        <TouchableOpacity style={{
                            ...style.button,
                            backgroundColor: style.colors.primary
                        }}
                            onPress={() => {
                                cache({ item: { id: item._id, nome: item.nome, quantidade: quantidade, unMedida: item.unMedida, preco: item.precoUn } })
                            }}
                        >
                            <Text >OK</Text>
                        </TouchableOpacity>
                    </View>
                </>
                    : null
                }
            </View>)
    }

    const renderItens = () => {
        let arr = [];
        
        for (let i = 0; i < data.length; i++) {
            arr.push(<SearchItem key={i} item={data[i]} />)
        }


        const ButtonOptions = () => {
            return (
                <TouchableOpacity
                    key="btg"
                    onPress={() => {
                        setModalOptionsVisible(true);
                    }}
                >
                    <AntDesign name="ellipsis1" size={26} color={style.colors.secondary} />
                </TouchableOpacity>
            )
        }

        arr.push(
            <View
                key="buttons"
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    marginTop: 10,
                    marginBottom: 10
                }}
            >
                {
                    actualPage === 1 ?
                        <AntDesign name="leftcircleo" size={26} color='transparent' /> :
                        <TouchableOpacity
                            key="btv"
                            style={{ margin: 10 }}
                            onPress={() => {
                                getItens(actualPage - 1)
                            }}
                        >
                            <AntDesign name="leftcircleo" size={26} color={style.colors.secondary} />
                        </TouchableOpacity>
                }

                <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                    <ButtonOptions />
                    <Text style={{ fontSize: 12 }}>{actualPage}/{numberPages}</Text>
                </View>

                {actualPage === numberPages ?
                    <AntDesign name="rightcircleo" size={26} color='transparent' /> :
                    <TouchableOpacity
                        key="btg"
                        onPress={() => {
                            getItens(actualPage + 1)
                        }}
                    >
                        <AntDesign name="rightcircleo" size={26} color={style.colors.secondary} />
                    </TouchableOpacity>
                }
            </View>
        )


        return arr;
    }

    const ModalOptions = () => {
        const [isOpen, setIsOpen] = useState(false);
        const [nome, setNome] = useState('');
        const [quantidade, setQuantidade] = useState('');
        const [unMedida, setUnMedida] = useState('');
        const [precoUn, setPrecoUn] = useState('');
        const resetForm = () => {
            setNome(''); setQuantidade(''); setUnMedida(''); setPrecoUn('');
        }
        const modalOptionStyle = {
            ...style.modal,
            height: 280
        }

        const ButtonAddMP = () => {
            return (
                <TouchableOpacity
                    style={{ ...style.button, ...style.buttonOutline, width: '80%' }}
                    onPress={
                        () => {
                            setIsOpen(true);
                        }
                    }
                >
                    <Text style={{ textAlign: 'center' }}>Adicionar matéria-prima não listada</Text>
                </TouchableOpacity>
            )
        }

        return (

            <Modal animationType="fade" transparent={true} visible={modalOptionsVisible}>
                <View style={style.modalShade}>
                    <View style={isOpen ? style.modal : modalOptionStyle}>
                        <View style={style.modalHeader}>
                            <Text style={style.mainText}>{isOpen ? 'Adicionar Matéria-Prima' : 'Opções'}</Text>
                        </View>

                        {!isOpen ?
                            <View style={{ flex: 1 }}>
                                <View style={{ width: '100%', alignItems: 'center' }}>
                                    <TouchableOpacity
                                        style={{ ...style.button, ...style.buttonOutline, width: '80%' }}
                                        onPress={
                                            () => {
                                                setModalOptionsVisible(false);
                                                getItens();
                                            }
                                        }
                                    >
                                        <Text style={{ textAlign: 'center' }}>Voltar a página 1</Text>
                                    </TouchableOpacity>

                                </View>
                                <TouchableOpacity
                                    onPress={() => { setModalOptionsVisible(false) }}
                                    style={{ position: 'absolute', bottom: 10, alignSelf: 'center' }}
                                >
                                    <MaterialCommunityIcons name="close-circle" size={26} color="red" />
                                </TouchableOpacity>
                            </View>
                            :
                            <ScrollView style={{ flex: 1 }}>
                                <InputWithLabel
                                    placeholder="Nome"
                                    label="Nome"
                                    value={nome}
                                    onChangeText={t => { setNome(t) }}
                                />
                                <InputWithLabel
                                    placeholder="Quantidade"
                                    label="Quantidade"
                                    type="numeric"
                                    value={quantidade}
                                    onChangeText={t => { setQuantidade(t) }}
                                />
                                <Select
                                    label="Unidade de medida"
                                    items={[
                                        { label: 'Kilogramas - Kg', value: 'Kg' },
                                        { label: 'Gramas - g', value: 'g' },
                                        { label: 'Miligramas - mg', value: 'mg' },
                                        { label: 'Litros - L', value: 'L' },
                                        { label: 'Mililitros - ml', value: 'ml' },
                                        { label: 'Unidade - un', value: 'un' },
                                    ]}
                                    value={unMedida}
                                    onValueChange={v => setUnMedida(v)}
                                />
                                <InputWithLabel
                                    placeholder="Preço unitário"
                                    label="Preço unitário"
                                    type="numeric"
                                    value={precoUn}
                                    onChangeText={t => { setPrecoUn(t) }}
                                />
                                <TouchableOpacity
                                    style={{
                                        ...style.button, alignSelf: 'center',
                                        backgroundColor: nome === '' || quantidade === '' || unMedida === '' || precoUn === '' ? '#ccc' : style.colors.primary
                                    }}
                                    disabled={nome === '' || quantidade === '' || unMedida === '' || precoUn === ''}
                                    onPress={
                                        () => {
                                            if (nome !== '' && quantidade !== '' && unMedida !== '' && precoUn !== '') {
                                                cache(new Date(), nome, quantidade, unMedida, precoUn);
                                                setIsOpen(false);
                                                resetForm();
                                            }
                                        }
                                    }
                                >
                                    <Text style={style.textButton}>Adicionar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => { setIsOpen(false) }}
                                    style={{ ...style.button, alignSelf: 'center', marginTop: 5, backgroundColor: 'gray' }}
                                >
                                    <Text style={{ color: 'white' }}>Cancelar</Text>
                                </TouchableOpacity>


                            </ScrollView>

                        }

                    </View>
                </View>
            </Modal>

        )

    }

    const SearchBar = () => {
        const [search, setSearch] = useState('');
        const [searching, setSearching] = useState(false);
        const [searchData, setSearchData] = useState([]);

        useEffect(() => {
            if (searchData.length > 0) {
                setNotFound(false);
                setData(searchData);
            }
        }, [searchData]);


        return (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <InputWithLabel label="Pesquisar" value={search} onChangeText={t => setSearch(t)} />
                {searching ? <ActivityIndicator size={24} color='black' /> : <>
                    <TouchableOpacity
                        disabled={search === '' || searching}
                        style={{
                            ...style.button, alignSelf: 'flex-end', backgroundColor:
                                search === '' || searching ? '#ccc' :
                                    style.colors.primary
                        }}
                        onPress={() => {
                            setSearching(true);

                            const dbRef = ref(db, `data/${getAuth().currentUser.uid}/mps`);
                            const query_ = query(dbRef, orderByChild('nome'), startAt(search), endAt(search + '\uf8ff'));
                            get(query_).then((snapshot) => {
                                if (snapshot.exists()) {
                                    const data = snapshot.val();
                                    const keys = Object.keys(data);
                                    const array = keys.map((key) => {
                                        return { ...data[key], id: key };
                                    });
                                    setSearchData(array);
                                }
                            }).catch((error) => {
                                console.error(error);
                            }).finally(() => {
                                setSearching(false);
                            });
                        }}
                    >
                        <AntDesign name="search1" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ ...style.button, alignSelf: 'flex-end', backgroundColor: style.colors.primary }}
                        onPress={() => {
                            setSearching(false);
                            setSearch('');
                            setNotFound(false);
                            getItens();
                        }}
                    >
                        <AntDesign name="closecircle" size={24} color="white" />
                    </TouchableOpacity>
                </>}
            </View>
        )
    }

    const [notFound, setNotFound] = useState(false);

    return (
        <ScrollView style={style.container}>
            <InputWithLabel label="Nome" onChangeText={t => setNome(t)} value={nome} />
            <Select label="Tipo"
                items={[
                    { label: 'Cabelo', value: 'Cabelo' },
                    { label: 'Corpo', value: 'Corpo' },
                    { label: 'Mãos e Rosto', value: 'Mãos e Rosto' },
                    { label: 'Unhas', value: 'Unhas' },
                    { label: 'Outros', value: 'Outros' },
                ]}
                onValueChange={t => setTipo(t)}
                value={tipo}
            />
            <Text style={style.text}>Matérias-primas:</Text>
            <SearchBar />
            {isLoading ? <ActivityIndicator size={24} color='black' /> :
                renderItens()
            }

            <Text style={style.text}>Matérias-primas selecionadas:</Text>
            {materiasPrimas !== null ?
                Object.keys(materiasPrimas).map((key, index) => {
                    return (
                        <View key={index} style={
                            {
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                margin: 5,
                                paddingTop: 10,
                                borderTopColor: 'black',
                                borderTopWidth: 1,
                            }
                        }>
                            <Text style={{ fontSize: 20, marginLeft: 5 }}>{materiasPrimas[key].nome} - {materiasPrimas[key].quantidade}{materiasPrimas[key].unMedida}</Text>
                            <TouchableOpacity style={{
                                ...style.button,
                                backgroundColor: 'red'
                            }}
                                onPress={() => {
                                    remove(ref(db, `data/${getAuth().currentUser.uid}/temp/form/${formId}/${key}`));
                                    get(ref(db, `data/${getAuth().currentUser.uid}/temp/form/${formId}/`)).then((snapshot) => {
                                        setMateriasPrimas(snapshot.val());
                                    });
                                }}
                            >
                                <AntDesign name="delete" size={18} color="white" />
                            </TouchableOpacity>
                        </View>
                    )
                })
                : <Text style={style.text}>Nenhuma matéria-prima selecionada</Text>
            }
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                <TouchableOpacity
                    style={style.button}
                    onPress={() => {
                        nome !== '' && tipo !== '' && materiasPrimas !== null ?
                            setModalVisible(true) :
                            Alert.alert('Preencha todos os campos')
                    }}
                >
                    <Text style={style.textButton}>Verificar</Text>
                </TouchableOpacity>
            </View>
            {modalVisible ? <Verificar /> : null}
            {modalOptionsVisible ? <ModalOptions /> : null}
            <Padding value={40} />
        </ScrollView>
    )
}

const CadProdutos = () => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [nome, setNome] = useState('');
    const [formulacao, setFormulacao] = useState('');
    const [nomeFormulacao, setNomeFormulacao] = useState('');
    const [descricao, setDescricao] = useState('');
    const [quantidade, setQuantidade] = useState(0);
    const [preco, setPreco] = useState(0);
    const [custo, setCusto] = useState('');
    const [date, setDate] = useState(null);
    const [validade, setValidade] = useState(null);
    const [maoDeObra, setMaoDeObra] = useState('');
    const [profit, setProfit] = useState(0);
    const navigation = useNavigation();

    const getFormulacoes = async () => {
        setIsLoading(true);
        get(ref(db, `data/${getAuth().currentUser.uid}/forms`)).then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                if (data === null) {
                    setIsLoading(false);
                    return;
                }
                const keys = Object.keys(data);
                const array = keys.map((key) => {
                    return { ...data[key], id: key };
                });
                setData(array);
            }
        }
        ).catch((error) => {
            console.error(error);
        }
        ).finally(() => {
            setIsLoading(false);
        }
        );
    };

    useEffect(() => {
        getFormulacoes();
    }, []);

    useEffect(() => {
        if (formulacao === '') return;
        setCusto(data.filter((item) => item._id === formulacao)[0].custo);
        setNomeFormulacao(data.filter((item) => item._id === formulacao)[0].nome)
    }, [formulacao]);

    useEffect(() => {
        if (custo === '' || preco === '' || preco === 0 || maoDeObra === '' || quantidade === '' || quantidade === 0) return;
        const c = parseFloat(custo);
        const p = parseFloat(preco);
        const m = parseFloat(maoDeObra);
        const q = parseFloat(quantidade);
        const profit = p - ((c + m) / q)
        if (profit === Infinity || isNaN(profit)) return;
        setProfit(profit.toFixed(2));
    }, [custo, preco, maoDeObra, quantidade]);

    const [clicked, setClicked] = useState(false);
    return (
        <ScrollView style={style.container} >
            {isLoading ?
                <ActivityIndicator size={24} color='black' /> :
                (<>
                    <InputWithLabel label="Nome" onChangeText={t => setNome(t)} value={nome} key="nome" />
                    <Select label="Formulação"
                        header="Selecione uma formulação"
                        items={data.map((item) => {
                            return { label: item.nome, value: item._id }
                        })}
                        onValueChange={t => setFormulacao(t)}
                        value={formulacao}
                    />
                    <InputWithLabel label="Descrição" value={descricao} onChangeText={t => setDescricao(t)} />
                    <DatePicker label="Data" date={date}
                        onChange={(e, d) => {
                            setDate(d);
                        }}
                    />
                    <DatePicker label="Validade" date={validade}
                        onChange={(e, d) => {
                            setValidade(d);
                        }}
                    />
                    <InputWithLabel value={custo.toString()} label="Custo (Total)" type="numeric" disabled={true} />
                    <InputWithLabel onChangeText={t => setPreco(t)} value={preco} label="Preço de Venda (un.)" type="numeric" />
                    <InputWithLabel onChangeText={t => setMaoDeObra(t)} value={maoDeObra} label="Mão de Obra" type="numeric" />
                    <InputWithLabel label="Quantidade" type="numeric" value={quantidade} onChangeText={t => setQuantidade(t)} />
                    <Text style={{ fontSize: 20, margin: 5 }}>Lucro aprox. por unidade: R${profit}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                        <TouchableOpacity
                            style={style.button}
                            disabled={clicked}
                            onPress={async () => {
                                if (nome === '' || descricao === '' || custo === '' || preco === '' || quantidade === '' || date === null || validade === null || formulacao === '') {
                                    Alert.alert('Preencha todos os campos');
                                    return;
                                }
                                var ok = false;
                                setClicked(true)
                                try {
                                    ok = await change({
                                        data: {
                                            nome: nome,
                                            descricao: descricao,
                                            custo: parseFloat(custo),
                                            preco: parseFloat(preco),
                                            quantidade: quantidade,
                                            data: date,
                                            validade: validade,
                                            formulacao: formulacao,
                                            maoDeObra: parseFloat(maoDeObra),
                                            lucro: profit,
                                            nomeFormulacao: nomeFormulacao
                                        },
                                        url: 'produtos',
                                        set: 'set'
                                    })
                                } catch (error) {
                                    console.error(error);
                                }
                                finally {
                                    setClicked(false);
                                }
                                if (!ok) {
                                    return;
                                }
                                navigation.replace('Produtos');
                            }}
                        >
                            <Text style={style.textButton}>
                                {
                                    clicked ? <ActivityIndicator size={18} color='black' /> : 'Salvar'
                                }
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <Padding />
                </>)}
        </ScrollView>
    )
}

const CadSaidas = () => {
    const [numberPages, setNumberPages] = useState(1);
    const [actualPage, setActualPage] = useState(1);
    const [produtos, setProdutos] = useState(null);
    const [vendaId, setVendaId] = useState(null);
    const [precoTotal, setPrecoTotal] = useState(0);
    const navigation = useNavigation();

    navigation.addListener('blur', () => {
        const onScanner = navigation.getState().routes.length === 3;
        if (!onScanner) //se o usuário não estiver na tela de scanner, remove a venda do cache
            remove(ref(db, `data/${getAuth().currentUser.uid}/temp/venda/${vendaId}/`));
    });

    const getItens = async (page) => {
        if (page === 0 || page > numberPages) return;
        const p = page ?? 1;
        setIsLoading(true);
        setActualPage(p);

        const dbRef = ref(db, `data/${getAuth().currentUser.uid}/produtos`);
        const query_ = query(dbRef, limitToFirst(p * 10));
        onValue(query_, (snapshot) => {
            const data = snapshot.val();
            if (data === null) { setIsLoading(false); return };
            const keys = Object.keys(data);
            const array = keys.map((key) => {
                return { ...data[key], id: key };
            });
            setData(array);
            setIsLoading(false);
        });

    };

    function getProdutosSelecionados() {
        onValue(ref(db, `data/${getAuth().currentUser.uid}/temp/venda/${vendaId}`), (snapshot) => {
            if (snapshot.exists()) {
                const val = snapshot.val();
                if (val.empty || val === null) {
                    setProdutos(null);
                    setPrecoTotal(0);
                    return;
                }
                setProdutos(snapshot.val());
                setPrecoTotal(Object.values(snapshot.val()).reduce((a, b) => a + b.preco, 0));
            }
            else {
                setProdutos(null);
                setPrecoTotal(0);
            }
        })
    }

    navigation.addListener('focus', () => {
        getProdutosSelecionados(); //atualiza os produtos selecionados ao retornar para a tela
    });

    useEffect(() => {
        push(ref(db, `data/${getAuth().currentUser.uid}/temp/venda`)).then((snapshot) => {
            setVendaId(snapshot.key);
            set(ref(db, `data/${getAuth().currentUser.uid}/temp/venda/${snapshot.key}`), { empty: true });
        });
        getItens();
        getProdutosSelecionados();

    }, []);

    const SearchItem = (props) => {
        const item = props.item
        const [isOpen, setIsOpen] = useState(false);
        const [qtd, setQtd] = useState('');
        const cache = ({ item }) => {
            if (qtd == 0 || qtd == '' || qtd == '0') {
                set(ref(db, `data/${getAuth().currentUser.uid}/temp/venda/${vendaId}/${item.id}`), null);
                getProdutosSelecionados();
                return;
            }
            const preco = item.preco * parseInt(qtd);
            set(ref(db, `data/${getAuth().currentUser.uid}/temp/venda/${vendaId}/empty`), null)
            update(ref(db, `data/${getAuth().currentUser.uid}/temp/venda/${vendaId}/${item.id}`), {
                id: item.id,
                quantidade: item.quantidade,
                nome: item.nome,
                preco: preco
            })
            getProdutosSelecionados();
        }

        return (
            <View>
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    margin: 5,
                    paddingTop: 10,
                    borderTopColor: 'black',
                    borderTopWidth: 1,
                }}>
                    <CheckBox
                        disabled={false}
                        value={isOpen}
                        onValueChange={(newValue) => {
                            if (!newValue) {
                                remove(ref(db, `data/${getAuth().currentUser.uid}/temp/venda/${vendaId}/${item.id}`));
                            }
                            setIsOpen(newValue)
                        }}
                    />
                    <Text style={{ fontSize: 20, marginLeft: 5 }}>{item.nome} - R$ {item.preco}</Text>
                </View>
                {isOpen ? <>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'flex-end',
                    }}
                    >
                        <InputWithLabel onChangeText={t => setQtd(t)} value={qtd.toString()} label={`Quantidade - ${item.quantidade}`} type="numeric" />
                        <TouchableOpacity style={{
                            ...style.button,
                            backgroundColor: style.colors.primary
                        }}
                            onPress={() => {
                                const qtd_ = parseInt(qtd);
                                qtd_ <= item.quantidade && qtd_ > 0 ?
                                    cache({ item: { id: item._id, nome: item.nome, quantidade: qtd_, preco: item.preco } }) :
                                    Alert.alert("Quantidade inválida");
                            }}>
                            <Text >OK</Text>
                        </TouchableOpacity>
                    </View>
                </>
                    : null
                }
            </View>)
    }

    const renderItens = () => {
        let arr = [];
        arr.push(
            <View key={'-1'} style={{ alignItems: 'center', borderBottomColor: 'black', borderBottomWidth: 1 }}>
                <TouchableOpacity
                    style={{ ...style.button, flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => {
                        navigation.navigate('Ler QR Code', {
                            vendaId: vendaId,
                            uid: getAuth().currentUser.uid,
                        });
                    }}>
                    <Text style={{ color: style.colors.primary, marginRight: 5 }}>Ler QR Code</Text>
                    <AntDesign name="qrcode" size={24} color={style.colors.primary} />
                </TouchableOpacity>
            </View>
        )
        for (let i = 0; i < data.length; i++) {
            if (data[i].quantidade !== 0)
                arr.push(<SearchItem key={i} item={data[i]} />)
        }
        if (arr.length === 1) arr.push(<Text key="noItens" style={{ color: 'red', alignSelf: 'center' }}>Nenhum produto em estoque.</Text>)
        if (numberPages > 1) {
            arr.push(
                <View
                    key="buttons"
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                    }}>
                    <TouchableOpacity
                        key="btv"
                        style={style.button}
                        onPress={() => {
                            getItens(actualPage - 1)
                        }}>
                        <Text style={style.text}>{actualPage === 1 ? '1' : '<'}</Text>
                    </TouchableOpacity>
                    <Text style={style.text}>{actualPage}/{numberPages}</Text>
                    <TouchableOpacity
                        key="btg"
                        style={style.button}
                        onPress={() => {
                            getItens(actualPage + 1)
                        }}
                    >
                        <Text style={style.text}>{actualPage === numberPages ? actualPage : '>'}</Text>
                    </TouchableOpacity>
                </View>
            )
        }
        return arr;
    }
    const [data, setData] = useState([]);
    const [date, setDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [cliente, setCliente] = useState('');
    const [naoVenda, setNaoVenda] = useState(false);

    return (
        <>

            <ScrollView style={style.container}>

                <InputWithLabel label="Cliente" onChangeText={t => setCliente(t)} value={cliente} />
                <DatePicker date={date} onChange={(e, d) => setDate(d)} label="Data" />
                <Text style={style.text}>Produtos:</Text>
                {isLoading ? <ActivityIndicator size={24} color='black' /> :
                    renderItens()
                }
                <Text style={style.text}>Produtos selecionados</Text>
                {produtos ? Object.keys(produtos).map((key, index) => {
                    return (
                        <View key={index} style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            margin: 5,
                            paddingTop: 10,
                            borderTopColor: 'black',
                            borderTopWidth: 1,
                        }}>
                            <Text >{index + 1}: {produtos[key].nome} - Quantidade: {produtos[key].quantidade}  - R${produtos[key].preco}</Text>
                            <TouchableOpacity
                                style={{
                                    ...style.button,
                                    backgroundColor: 'red'
                                }}
                                onPress={() => {
                                    remove(ref(db, `data/${getAuth().currentUser.uid}/temp/venda/${vendaId}/${key}`));
                                    getProdutosSelecionados();
                                    /*get(ref(db, `data/${getAuth().currentUser.uid}/temp/venda/${vendaId}/`)).then((snapshot) => {
                                        setProdutos(snapshot.val());
                                    })*/
                                }}
                            >
                                <AntDesign name="delete" size={18} color="white" />
                            </TouchableOpacity>
                        </View>
                    )
                }) : <Text>Nenhum produto selecionado</Text>
                }
                <View style={{ flexDirection: 'row', marginTop: 5 }}>
                    <Text style={style.text}>Tipo de saída: </Text>
                    <TouchableOpacity
                        style={{
                            backgroundColor: "transparent",
                            borderColor: style.colors.secondary,
                            borderWidth: 1,
                            borderRadius: 25,
                            padding: 5,
                        }}
                        onPress={() => {
                            Alert.alert('Tipo de saída', 'Se o tipo de saída for "Outros", o valor não será contabilizado nas vendas, mas o estoque ainda será alterado.')
                        }}
                    ><AntDesign name="info" size={18} color={style.colors.secondary} /></TouchableOpacity>
                </View>
                <Text >{naoVenda ? 'Outros' : 'Venda comum'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Switch value={naoVenda} onValueChange={setNaoVenda} />
                    <Text style={style.text}>Toque para alterar</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                    <TouchableOpacity
                        style={style.button}
                        onPress={() => {
                            if (cliente !== '' && date !== '' && produtos !== null) {
                                change({ data: { cliente: cliente, data: date.getTime(), produtos: produtos, preco: precoTotal, naoVenda: naoVenda }, url: 'vendas', set: 'set' })
                                navigation.navigate('Saídas')
                            } else {
                                Alert.alert('Preencha todos os campos')
                            }
                        }}>
                        <Text style={style.textButton}>Salvar</Text>
                    </TouchableOpacity></View>
                <Padding value={40} />
            </ScrollView></>
    )
}

export { CadMateriasPrimas, CadFormulacoes, CadProdutos, CadSaidas, change };