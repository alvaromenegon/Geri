import { DatePicker, Select } from '../components/InputWithLabel';
import { InputWithLabel } from '../components/InputWithLabel';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import style from '../assets/style.json';
import { useState, useEffect } from 'react';
import CheckBox from 'expo-checkbox'
import { useNavigation } from '@react-navigation/native';
import BottomBar from '../components/BottomBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Padding from '../components/Padding';
import { getDatabase, update, ref, set, push, get, query, limitToFirst, remove } from 'firebase/database';
import firebase from '../services/firebaseConfig';
import { getAuth, signOut } from 'firebase/auth';
import { AntDesign } from '@expo/vector-icons';
//import MateriasPrimasSelecionadas from '../components/MateriasPrimasSelecionadas'; não está funcionando
const db = getDatabase(firebase);

function change(props) {
    switch (props.url) {
        case 'mps':
            props.data.dataCompra = props.data.dataCompra.getTime();
            props.data.validade = props.data.validade.getTime();
            break;
        case 'produtos':
            props.data.data = props.data.data.getTime();
            break;
        default:
            break;
    }

    var erro = false;

    AsyncStorage.getItem('user').then((value) => {
        const user = JSON.parse(value);
        const uid = user.uid;
        if (uid !== getAuth().currentUser.uid) {
            Alert.alert('Erro', 'Houve um erro com sua autenticação\nPor favor, faça login novamente');
            signOut(getAuth());
            return false;
        }
        if (props.set === 'set') {
            const url = ref(db, `data/${uid}/${props.url}`)
            const nodeRef = push(url);
            const data = props.url === 'mps' ? {
                ...props.data,
                _id: nodeRef.key,
                comprado: props.data.quantidade
            } :
                {
                    ...props.data,
                    _id: nodeRef.key,
                }
            set(nodeRef, data)
                .then((ret) => {
                    if (props.url === 'produtos') {
                        //implementar
                        //reduzir o estoque de materias primas
                    }
                })
                .catch((err) => {
                    console.log(err)
                    erro = true;
                })
        } else {
            update(url, data).then((ret) => {
                console.log(ret)
            }
            ).catch((err) => {
                console.log(err);
                erro = true;
            })
        }

        if (erro) {
            Alert.alert('Erro', 'Erro ao salvar os dados');
            return false;
        }
        return true;
    })
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

const CadMateriasPrimas = ({ route }) => {
    const Verificar = (props) => {
        const [isLoading, setIsLoading] = useState(false);
        const data = props.data
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
                                <Text style={style.buttonText}>Salvar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{
                                ...style.button,
                                backgroundColor: 'gray'
                            }}
                                onPress={() => {
                                    setModalVisible(!modalVisible);
                                }}
                            >
                                <Text style={style.buttonText}>Voltar</Text>
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
    const [qtd, setQtd] = useState(0);
    const [unMedida, setUnMedida] = useState('');
    const [preco, setPreco] = useState(0);
    const [precoUn, setPrecoUn] = useState(0);
    const [fornecedor, setFornecedor] = useState('');

    /*let id = false;
    if (route.params != undefined) {
        id = route.params.id || false;
    } else {
        id = false;
    }*/
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
    /*if (id) {

            getItens();
        }, []);
    }*/

    return (

        <ScrollView style={style.container}>
            {modalVisible ?
                <Verificar
                    data={{
                        nome: nome,
                        dataCompra: dataCompra,
                        validade: validade,
                        quantidade: qtd,
                        unMedida: unMedida,
                        preco: preco,
                        fornecedor: fornecedor,
                        precoUn: precoUn.toFixed(3)
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
            <InputWithLabel value={qtd.toString()} onChangeText={text => setQtd(text)} label="Quantidade" type="numeric" />
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

            <InputWithLabel value={preco.toString()} onChangeText={t => setPreco(t)} label="Preço" type="numeric" />
            <Text style={{ fontSize: 20, margin: 5 }}>Preço Unitário: R${precoUn.toFixed(2)}/{unMedida}</Text>
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
    const [formId, setFormId] = useState(null);
    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState('');
    const navigation = useNavigation();
    navigation.addListener('blur', () => {
        remove(ref(db, `data/${getAuth().currentUser.uid}/temp/form/${formId}/`));
    });

    const Verificar = () => {
        const [custo, setCusto] = useState(0);
        let preco = 0;
        useEffect(() => {     
            Object.values(materiasPrimas).forEach((item) => {
                preco += item.custo;
                console.log(item.custo)
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
                        <Text style={style.text}>Nome:{nome} </Text>
                        <Text style={style.text}>Tipo: {tipo}</Text>
                        <Text style={style.text}>Custo: R${custo.toFixed(2)}</Text>
                        <Text style={style.text}>Matérias-primas: </Text>
                        <FlatList
                            data={Object.values(materiasPrimas)}
                            renderItem={({ item }) => <Text key={item._id}>{item.nome} -{item.quantidade}{item.unMedida}</Text>}
                            keyExtractor={item => item.id}
                            ListFooterComponent={isLoading ? <ActivityIndicator /> : null}
                        />
                        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-around' }}>
                            <TouchableOpacity style={style.button}
                                onPress={() => {
                                    change({ data: { nome: nome, tipo: tipo,custo:custo.toFixed(3), materiasprimas: { ...materiasPrimas }, }, url: 'forms', set: 'set' })
                                    setModalVisible(!modalVisible);
                                    navigation.replace('Formulações');
                                }}>
                                <Text style={style.buttonText}>Salvar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{
                                ...style.button,
                                backgroundColor: 'gray'
                            }}
                                onPress={() => {
                                    setModalVisible(false);
                                }}
                            >
                                <Text style={style.buttonText}>Voltar</Text>
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
        get(ref(db, `data/${getAuth().currentUser.uid}/temp/form/${formId}/`)).then((snapshot) => {
            //setMateriasPrimas(snapshot.val());
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
            setFormId(snapshot.key);
            set(ref(db, `data/${getAuth().currentUser.uid}/temp/form/${snapshot.key}`), { empty: true });
        });
        getItens();
    }, []);

    const SearchItem = (props) => {
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
                            <Text style={style.buttonText}>OK</Text>
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
        arr.push(
            <View
                key="buttons"
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                }}
            >
                <TouchableOpacity
                    key="btv"
                    style={style.button}
                    onPress={() => {
                        getItens(actualPage - 1)
                    }}
                >
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
        return arr;
    }

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
            {isLoading ? <ActivityIndicator size={24} color='black' /> :
                renderItens()
            }
            <Text style={style.text}>Matérias-primas selecionadas:</Text>
            {materiasPrimas !== null ?
                /*  A fazer:
                *   Transformar em componente
                *   Corrigir bug do checkbox desativar ao dar OK
                */
                Object.keys(materiasPrimas).map((key, index) => {
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
                            <Text style={{ fontSize: 20, marginLeft: 5 }}>{materiasPrimas[key].nome} - {materiasPrimas[key].quantidade}{materiasPrimas[key].unMedida}</Text>
                            <TouchableOpacity style={{
                                ...style.button,
                                backgroundColor: 'red'
                            }}
                                onPress={() => {
                                    remove(ref(db, `data/${getAuth().currentUser.uid}/temp/form/${formId}/${key}`));
                                    get(ref(db, `data/${getAuth().currentUser.uid}/temp/form/${formId}/`)).then((snapshot) => {
                                        setMateriasPrimas(snapshot.val());
                                    }
                                    );
                                    //A fazer: usar o setMateriasPrimas em um onValue do banco de dados
                                }}
                            >
                                <AntDesign name="delete" size={18} color="white" />
                            </TouchableOpacity>

                        </View>
                    )
                })
                : <Text style={style.text}>Nenhuma matéria-prima selecionada</Text>
            }


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
            {modalVisible ? <Verificar /> : null}
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
    const navigation = useNavigation();

    const getFormulacoes = async () => {
        setIsLoading(true);
        get(ref(db, `data/${getAuth().currentUser.uid}/forms`)).then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
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
                    <InputWithLabel value={custo.toString()} label="Custo" type="numeric" disabled={true} />
                    <InputWithLabel onChangeText={t => setPreco(t)} value={preco} label="Preço de Venda" type="numeric" />
                    <InputWithLabel label="Quantidade" type="numeric" value={quantidade} onChangeText={t => setQuantidade(t)} />
                    <TouchableOpacity
                        style={style.button}
                        onPress={() => {
                            if(nome === '' || descricao === '' || custo === '' || preco === '' || quantidade === '' || date === null || validade === null || formulacao === '') {
                                Alert.alert('Preencha todos os campos');
                                return;
                            }
                            console.log(validade)
                            change({
                                data: {
                                    nome: nome,
                                    descricao: descricao,
                                    custo: custo,
                                    preco: parseFloat(preco),
                                    quantidade: quantidade,
                                    data: date,
                                    validade: validade, //não está funcionando
                                    formulacao: formulacao,
                                    nomeFormulacao: nomeFormulacao
                                },
                                url: 'produtos',
                                set: 'set'
                            })
                            navigation.navigate('Produtos');
                        }}
                    >
                        <Text style={style.textButton}>Salvar</Text>
                    </TouchableOpacity>

                </>)}
            <Padding padding={60} />
        </ScrollView>
    )
}

const CadSaidas = () => {
    const [numberPages, setNumberPages] = useState(1);
    const [actualPage, setActualPage] = useState(1);
    const getItens = async (page) => {
        if (page === 0 || page > numberPages) return;
        const p = page ?? 1;
        setIsLoading(true);
        setActualPage(p);
        get(ref(db, `data/${getAuth().currentUser.uid}/produtos`)).then((snapshot) => {
            console.log(snapshot)
            if (snapshot.exists()) {
                const data = snapshot.val();
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
        getItens()
    }, []);

    const SearchItem = (props) => {
        const item = props.item
        const [isOpen, setIsOpen] = useState(false);
        const [qtd, setQtd] = useState(0);

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
                        onValueChange={(newValue) => setIsOpen(newValue)}
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
                        <InputWithLabel onChangeText={t => setQtd(t)} value={qtd} label={`Quantidade - ${item.quantidade}`} type="numeric" />
                        <TouchableOpacity
                            style={style.button}
                            onPress={() => {
                                if (qtd === 0) {
                                    Alert.alert('Preencha a quantidade');
                                    return;
                                }
                                if (qtd > item.quantidade) {
                                    Alert.alert('Quantidade maior que o estoque');
                                    return;
                                }
                                Alert.alert('Não implementado')
                                /*change({
                                    data: {
                                        quantidade: item.quantidade - qtd
                                    },
                                    url: `produtos/${item.id}`,
                                    set: 'update'
                                })*/
                                /*change({
                                    data: {
                                        nome: item.nome,
                                        descricao: item.descricao,
                                        custo: item.custo,
                                        preco: item.preco,
                                        quantidade: qtd,
                                        data: new Date(),
                                        validade: item.validade,
                                        formulacao: item.formulacao,
                                        nomeFormulacao: item.nomeFormulacao
                                    },
                                    url: 'saidas',
                                    set: 'push'
                                })
                                getItens(actualPage)*/
                            }}
                        >
                            <Text style={style.textButton}>Salvar</Text>
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
            if (data[i].unidades !== 0)
                arr.push(<SearchItem key={i} item={data[i]} />)
        }
        if (arr.length === 0) arr.push(<Text key="noItens" style={style.text}>Nenhum produto em estoque.</Text>)
        if (numberPages > 1) {
            arr.push(
                <View
                    key="buttons"
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                    }}
                >
                    <TouchableOpacity
                        key="btv"
                        style={style.button}
                        onPress={() => {
                            getItens(actualPage - 1)
                        }}
                    >
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

    return (
        <>
            <ScrollView style={style.container}>
                <Text style={style.text}>Produtos:</Text>
                {isLoading ? <ActivityIndicator size={24} color='black' /> :
                    renderItens()
                }
                <DatePicker date={date} onChange={(e, d) => setDate(d)} label="Data" />
            </ScrollView>
            <BottomBar /></>
    )
}

const styles = StyleSheet.create({
    searchButton: {
        backgroundColor: '#000',
    },
    paginationButton: {
        width: 30,
        height: 30,
        backgroundColor: '#000',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export { CadMateriasPrimas, CadFormulacoes, CadProdutos, CadSaidas };