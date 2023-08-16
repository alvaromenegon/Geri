import { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Modal, Keyboard } from 'react-native';
import { get, query, ref, limitToFirst, getDatabase, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { AntDesign } from '@expo/vector-icons';
import { InputWithLabel, Select } from '../components/InputWithLabel';
import style from '../assets/style.json';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Calculadora = () => {
    const [data, setData] = useState([]);
    const [materiasPrimas, setMateriasPrimas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [numberPages, setNumberPages] = useState(1);
    const [actualPage, setActualPage] = useState(1);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalOptionsVisible, setModalOptionsVisible] = useState(false);
    const ref_ = useRef(null);
    const db = getDatabase();

    const Verificar = () => {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}>
                <View style={style.modalShade}>
                    <View style={style.modal}>
                        <View style={style.modalHeader}>
                            <Text style={style.mainText}>Custo</Text>
                        </View>
                        <View style={{ flex: 1 }} >
                            <View style={{ flexDirection: 'row', borderColor: style.colors.primaryDark, borderWidth: 1 }}>
                                <View style={{ width: '40%', borderRightColor: style.colors.primaryDark, borderRightWidth: 1 }} >
                                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Nome</Text>
                                </View>
                                <View style={{ width: '30%', borderRightColor: style.colors.primaryDark, borderRightWidth: 1 }}>
                                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Quantidade</Text>
                                </View>
                                <View style={{ width: '30%' }}>
                                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Custo (R$)</Text>
                                </View>
                            </View>

                            {materiasPrimas.map((item, index) => {
                                return (
                                    <View key={index} style={{ flexDirection: 'row', borderColor: style.colors.primaryDark, borderWidth: 1 }}>
                                        <View style={{ width: '40%', borderRightColor: style.colors.primaryDark, borderRightWidth: 1 }} >
                                            <Text style={style.td}>{item.nome}</Text>
                                        </View>
                                        <View style={{ width: '30%', borderRightColor: style.colors.primaryDark, borderRightWidth: 1 }}>
                                            <Text style={style.td}>{item.qtd}{item.unMedida}</Text>
                                        </View>
                                        <View style={{ width: '30%' }}>
                                            <Text style={style.td}>{item.custo.toFixed(2)}</Text>
                                        </View>
                                    </View>
                                )
                            })}
                            <View style={{ flexDirection: 'row', borderColor: style.colors.primaryDark, borderWidth: 1 }}>
                                <View style={{ width: '70%', borderRightColor: style.colors.primaryDark, borderRightWidth: 1 }} >
                                    <Text style={style.td}>Total</Text>
                                </View>
                                <View style={{ width: '30%' }}>
                                    <Text style={style.td}>{materiasPrimas.reduce((a, b) => a + b.custo, 0).toFixed(2)}</Text>

                                </View>
                            </View>

                        </View>
                        <TouchableOpacity
                            style={{ alignSelf: 'center', marginRight: 10, marginTop: 10 }}
                            onPress={() => {
                                setModalVisible(false);
                            }}
                        >
                            <AntDesign name="closecircle" size={26} color={'red'} />
                        </TouchableOpacity>
                    </View>


                </View>
            </Modal>
        )
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

        return (

            <Modal animationType="slide" transparent={true} visible={modalOptionsVisible}>
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

    const cache = (id, nome, qtd, unMedida, precoUn) => {
        const custo = qtd * precoUn;
        const item = {
            id: id,
            nome: nome,
            qtd: qtd,
            unMedida: unMedida,
            custo: custo
        }
        setMateriasPrimas(materiasPrimas => [...materiasPrimas, item]);
    }

    const remove = (id) => {
        setMateriasPrimas(materiasPrimas.filter((item) => item.id !== id));
    }

    useEffect(() => {
        getItens();
    }, []);

    const SearchItem = (props) => { //Renderiza um item da lista
        const item = props.item
        const [isOpen, setIsOpen] = useState(false);
        const [quantidade, setQuantidade] = useState('');

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
                    <TouchableOpacity style={{ ...style.button, backgroundColor: style.colors.primary }}

                        onPress={() => {
                            setIsOpen(!isOpen);
                        }}

                    >{
                            isOpen ?
                                <AntDesign name="up" size={18} color="white" />
                                :
                                <AntDesign name="down" size={18} color="white" />
                        }
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'column' }}>
                        <Text style={{ fontSize: 20, marginLeft: 5 }}>{item.nome}</Text>
                        <Text style={{ fontSize: 12, marginLeft: 5 }}>Validade: {new Date(item.validade).toLocaleDateString()}</Text>
                    </View>
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
                            label={`${item.quantidade}${item.unMedida} em estoque`} type="numeric" />
                        <TouchableOpacity style={{
                            ...style.button,
                            backgroundColor: style.colors.primary
                        }}
                            onPress={() => {
                                if (quantidade !== '') {
                                    cache(item.id, item.nome, quantidade, item.unMedida, item.precoUn);
                                    setQuantidade('');
                                }
                            }}
                        >
                            <AntDesign name="save" size={18} color="black" />
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

                <Text style={style.text}>{actualPage}/{numberPages}</Text>

                {actualPage === numberPages ?
                    <TouchableOpacity
                        key="btg"
                        onPress={() => {
                            setModalOptionsVisible(true);
                        }}
                    >
                        <AntDesign name="ellipsis1" size={26} color={style.colors.secondary} />
                    </TouchableOpacity> :
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

    const focusList = () => {
        ref_.current.scrollToEnd({ animated: true });
    }

    return (<>
        <ScrollView ref={ref_} style={style.container}>
            <Verificar />
            <ModalOptions />
            <Text style={style.text}>Matérias-primas:</Text>
            {isLoading ? <ActivityIndicator size={24} color='black' /> :
                renderItens()
            }

            <Text style={style.text}>Matérias-primas selecionadas:</Text>
            {materiasPrimas.length !== 0 ?
                materiasPrimas.map((item, index) => {
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
                            <Text style={{ fontSize: 16, marginLeft: 5 }}>{item.nome} - {item.qtd}{item.unMedida}</Text>
                            <TouchableOpacity style={{
                                ...style.button,
                                backgroundColor: 'red'
                            }}
                                onPress={() => {
                                    remove(item.id);
                                }}
                            >
                                <AntDesign name="delete" size={18} color="white" />
                            </TouchableOpacity>
                        </View>
                    )
                })
                : <Text style={{ fontSize: 16 }}>Nenhuma matéria-prima selecionada</Text>
            }
            <View style={{ flexDirection: 'row', justifyContent: 'center', paddingBottom: 40 }}>
                <TouchableOpacity
                    style={
                        materiasPrimas.length > 0 ?
                            style.button :
                            {
                                ...style.button,
                                backgroundColor: '#ccc'
                            }
                    }
                    disabled={materiasPrimas.length === 0}
                    onPress={() => {
                        if (materiasPrimas.length !== 0)
                            setModalVisible(true);
                    }}
                >
                    <Text style={style.textButton}>Verificar</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
        { materiasPrimas.length > 0 &&
        <View style={{position: 'absolute', bottom: 15, right: 13, zIndex: 1}}>
            <Text style={{ color:'red', position: 'absolute', top:-5, right:-6, zIndex: 2, fontSize: 14, fontWeight:'bold' }}>{materiasPrimas.length}</Text>
            <TouchableOpacity
                onPress={() => {
                    focusList();
                }}
            >
                <MaterialCommunityIcons name="leaf-circle-outline" size={28} color={style.colors.secondary} />
            </TouchableOpacity>
            </View>
        }
    </>
    )
}

export default Calculadora;