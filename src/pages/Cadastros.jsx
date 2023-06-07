import { DatePicker, Select } from '../components/InputWithLabel';
import { InputWithLabel } from '../components/InputWithLabel';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import style from '../assets/style.json';
import { useState, useEffect } from 'react';
import CheckBox from 'expo-checkbox'
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Padding from '../components/Padding';
import { getDatabase, update, ref, set, push, get, query, limitToFirst, remove, onValue } from 'firebase/database';
import firebase from '../services/firebaseConfig';
import { getAuth, signOut } from 'firebase/auth';
import { AntDesign } from '@expo/vector-icons';
import { BarCodeScanner } from 'expo-barcode-scanner';
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
            props.data.validade = props.data.validade.getTime();
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
                .then(() => {
                    if (props.url === 'mps') {
                        //adicionar a saida no banco de dados
                        //para ser utilizado no Faturamento
                        const dataCompra = new Date(props.data.dataCompra);
                        const ano = dataCompra.getFullYear();
                        const mes = dataCompra.getMonth() + 1;
                        const id = new Date().getTime();
                        set(ref(db, `data/${uid}/faturamento/saidas/${id}`), {
                            _id: id,
                            data: {
                                mes: mes,
                                ano: ano,
                            },
                            idProduto: nodeRef.key,
                            valor: parseFloat(props.data.preco),
                        })


                    } else if (props.url === 'vendas') {
                        //adicionar a entrada no banco de dados
                        //para ser utilizado no Faturamento
                        if (!props.data.naoVenda) {
                            const dataVenda = new Date();
                            const ano = dataVenda.getFullYear();
                            const mes = dataVenda.getMonth() + 1;
                            const id = dataVenda.getTime();
                            set(ref(db, `data/${uid}/faturamento/entradas/${id}`), {
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
                        Object.entries(produtos).forEach((item) => {
                            const id = item[0];
                            const quantidade = item[1].quantidade
                            get(ref(db, `data/${uid}/produtos/${id}`))
                                .then((snapshot) => {
                                    const data = snapshot.val();
                                    const estoque = data.quantidade;
                                    const novoEstoque = (estoque - quantidade);
                                    update(ref(db, `data/${uid}/produtos/${id}`), {
                                        quantidade: novoEstoque
                                    })
                                    if (novoEstoque == 0) {
                                        update(ref(db, `data/${uid}/avisos`), {
                                            noProd: true
                                        })
                                    }
                                })
                        })
                    }
                    if (props.url === 'produtos') {
                        //reduzir o estoque de materias primas
                        const formulacao = props.data.formulacao;
                        get(ref(db, `data/${uid}/forms/${formulacao}`)).then((snapshot) => {
                            const data = snapshot.val();
                            const materiasPrimas = data.materiasprimas;
                            Object.entries(materiasPrimas).forEach((item) => {
                                const id = item[0];
                                const quantidade = typeof item[1].quantidade === 'number' ? item[1].quantidade : parseFloat(item[1].quantidade);

                                get(ref(db, `data/${uid}/mps/${id}`)).then((snapshot) => {
                                    const data = snapshot.val();
                                    const estoque = data.quantidade;
                                    const novoEstoque = (estoque - quantidade);
                                    update(ref(db, `data/${uid}/mps/${id}`), {
                                        quantidade: novoEstoque
                                    })
                                    if (novoEstoque < 1) {
                                        update(ref(db, `data/${uid}/avisos`), {
                                            noMps: true
                                        })
                                    }
                                })
                            })
                        })
                    }
                })
                .catch((err) => {
                    console.err(err)
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
    const [qtd, setQtd] = useState('');
    const [unMedida, setUnMedida] = useState('');
    const [preco, setPreco] = useState('');
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
                                    change({ data: { nome: nome, tipo: tipo, custo: custo.toFixed(3), materiasprimas: { ...materiasPrimas }, }, url: 'forms', set: 'set' })
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
        /*get(ref(db, `data/${getAuth().currentUser.uid}/temp/form/${formId}/`)).then((snapshot) => {
            //setMateriasPrimas(snapshot.val());
        });*/
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
                                    });
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
                            if (nome === '' || descricao === '' || custo === '' || preco === '' || quantidade === '' || date === null || validade === null || formulacao === '') {
                                Alert.alert('Preencha todos os campos');
                                return;
                            }
                            change({
                                data: {
                                    nome: nome,
                                    descricao: descricao,
                                    custo: parseFloat(custo),
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
    const [produtos, setProdutos] = useState(null);
    const [vendaId, setVendaId] = useState(null);
    const [precoTotal, setPrecoTotal] = useState(0);
    const navigation = useNavigation();
    const [scanned, setScanned] = useState(false);
    const [hasPermission, setHasPermission] = useState(null);
    const [click, setClick] = useState(false);
    navigation.addListener('blur', () => {
        remove(ref(db, `data/${getAuth().currentUser.uid}/temp/venda/${vendaId}/`));
    });

    const getItens = async (page) => {
        if (page === 0 || page > numberPages) return;
        const p = page ?? 1;
        setIsLoading(true);
        setActualPage(p);
        /*onValue(ref(db, `data/${getAuth().currentUser.uid}/produtos`),(snapshot) => {
            console.log(snapshot.val())
        });*/
        const dbRef = ref(db, `data/${getAuth().currentUser.uid}/produtos`);
        const query_ = query(dbRef, limitToFirst(p * 10));
        onValue(query_, (snapshot) => {
            const data = snapshot.val();
            if (data === null) {setIsLoading(false);return};
            const keys = Object.keys(data);
            const array = keys.map((key) => {
                return { ...data[key], id: key };
            });
            setData(array);
            setIsLoading(false);
        })
    };

    useEffect(() => {
        /*const getBarCodeScannerPermissions = async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        getBarCodeScannerPermissions();*/
        push(ref(db, `data/${getAuth().currentUser.uid}/temp/venda`)).then((snapshot) => {
            setVendaId(snapshot.key);
            set(ref(db, `data/${getAuth().currentUser.uid}/temp/venda/${snapshot.key}`), { empty: true });
        });
        getItens()
    }, []);



    const SearchItem = (props) => {
        const item = props.item
        const [isOpen, setIsOpen] = useState(false);
        const [qtd, setQtd] = useState('');
        const cache = ({ item }) => {
            if (qtd == 0 || qtd == '' || qtd == '0') {
                set(ref(db, `data/${getAuth().currentUser.uid}/temp/venda/${vendaId}/${item.id}`), null)
                get(ref(db, `data/${getAuth().currentUser.uid}/temp/venda/${vendaId}/`)).then((snapshot) => {
                    setProdutos(snapshot.val());
                });
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
            get(ref(db, `data/${getAuth().currentUser.uid}/temp/venda/${vendaId}/`)).then((snapshot) => {
                setProdutos(snapshot.val())
                setPrecoTotal(Object.values(snapshot.val()).reduce((a, b) => a + b.preco, 0));
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
        /*arr.push(
            <View key={'-1'} style={{ alignItems: 'center' }}>
                <TouchableOpacity
                    style={style.button}
                    onPress={() => {
                        if (hasPermission === null) {
                            Alert.alert("Aguardando permissão para acessar a câmera");
                            return false;
                        }
                        if (hasPermission === false) {
                            Alert.alert("É necessário permissão para acessar a câmera");
                            return false;
                        }
                        setClick(true)
                    }}>
                    <Text style={{ color: style.colors.primaryLight }}>Ler QR Code <AntDesign name="qrcode" size={24} color="black" /></Text>
                </TouchableOpacity>
            </View>
        )*/
        for (let i = 0; i < data.length; i++) {
            if (data[i].quantidade !== 0)
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

    const QRCodeScanner = () => {
        const [scannedItem, setScannedItem] = useState(null);
        const handleBarCodeScanned = ({ type, data }) => {

            get(ref(db, `data/${getAuth().currentUser.uid}/produtos/${data}`)).then((snapshot) => {
                if (snapshot.exists()) {
                    setScannedItem(snapshot.val());
                    if (scannedItem.quantidade < 0) {
                        Alert.alert("Produto sem estoque");
                        setScannedItem(null);
                        setClick(false);
                        setScanned(false);
                    } else setScanned(true);
                } else {
                    setClick(false);
                    setScanned(false);
                    setScannedItem(null);
                    Alert.alert("Produto não encontrado");
                }
            });

            //alert(`Bar code with type ${type} and data ${data} has been scanned!`);
        };
        const [qtd, setQtd] = useState(0);
        return (<>
            <BarCodeScanner
                onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                style={StyleSheet.absoluteFillObject}
            />
            {
                (scanned) && <>
                    <InputWithLabel label={"Quantidade - " + scannedItem.quantidade + ' em estoque'} onChangeText={t => setQtd(t)} value={qtd.toString()} type="numeric" />
                    <TouchableOpacity style={{
                        ...style.button,
                        backgroundColor: style.colors.primary
                    }}
                        onPress={() => {
                            const qtd_ = parseInt(qtd);
                            if (qtd_ <= scannedItem.quantidade && qtd_ > 0) {
                                cache({ item: { id: scannedItem._id, nome: scannedItem.nome, quantidade: qtd_, preco: scannedItem.preco } })
                                setClick(false)
                                setScanned(false)
                            } else
                                Alert.alert("Quantidade inválida");
                        }}>
                        <Text style={style.buttonText}>OK</Text>
                    </TouchableOpacity>
                </>
            }
            <TouchableOpacity
                style={{
                    borderRadius: 50,
                    backgroundColor: 'red',
                    position: 'absolute',
                    bottom: 0,
                    margin: 10,
                    padding: 10,
                    alignSelf: 'center'
                }}
                onPress={() => {
                    setClick(false)
                    setScanned(false)
                }}>
                <AntDesign name="close" size={24} color="white" />
            </TouchableOpacity>
        </>
        )
    }


    return (
        <>
            {click ? <QRCodeScanner />
                :
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
                                <Text >{produtos[key].nome} - {produtos[key].preco}</Text>
                                <TouchableOpacity
                                    style={{
                                        ...style.button,
                                        backgroundColor: 'red'
                                    }}
                                    onPress={() => {
                                        remove(ref(db, `data/${getAuth().currentUser.uid}/temp/venda/${vendaId}/${key}`));
                                        get(ref(db, `data/${getAuth().currentUser.uid}/temp/venda/${vendaId}/`)).then((snapshot) => {
                                            setProdutos(snapshot.val());
                                        })
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
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Switch value={naoVenda} onValueChange={setNaoVenda} />
                        <Text style={style.text}>{naoVenda ? 'Outros' : 'Venda comum'}</Text>
                    </View>
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
                    </TouchableOpacity>
                    <Padding value={40} />
                </ScrollView>}</>
    )
}

export { CadMateriasPrimas, CadFormulacoes, CadProdutos, CadSaidas };