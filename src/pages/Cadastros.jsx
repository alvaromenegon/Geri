import Lists from '../components/Lists';
import { DatePicker, Select } from '../components/InputWithLabel';
import { InputWithLabel } from '../components/InputWithLabel';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import style from '../assets/style.json';
import { useState, useRef, useEffect } from 'react';
import { api, getItens } from '../services/api';
import CheckBox from 'expo-checkbox'
import { useNavigation } from '@react-navigation/native';
import BottomBar from '../components/BottomBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Padding from '../components/Padding';



//const basicUrl = 'https://controle-produtos.up.railway.app/newApi/';
const basicUrl = 'http://192.168.0.104:8080/newApi/';






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
                            data={data}
                            renderItem={({ item }) => <Text style={style.text}>{item}</Text>}
                            keyExtractor={(item, index) => index.toString()}
                            ListFooterComponent={isLoading ? <ActivityIndicator /> : null}
                        />
                        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-around' }}>
                            <TouchableOpacity style={style.button}
                                onPress={() => {
                                    Alert.alert('Cadastro Concluídos', 'Text');
                                    api({
                                        method: 'post',
                                        url: 'mp',
                                        data: {
                                            nome: nome,
                                            dataCompra: dataCompra,
                                            validade: validade,
                                            qtd: qtd,
                                            unMedida: unMedida,
                                            preco: preco,
                                            precoUn: precoUn
                                        }
                                    }).then((response) => {
                                        if (response.status == 200) {
                                            navigation.navigate('Matérias-Primas', { refresh: true });
                                            AsyncStorage.removeItem('failed');
                                        }
                                        else {
                                            AsyncStorage.setItem('failed', JSON.stringify(
                                                {
                                                    nome: nome,
                                                    dataCompra: dataCompra,
                                                    validade: validade,
                                                    qtd: qtd,
                                                    unMedida: unMedida,
                                                    preco: preco,
                                                    precoUn: precoUn
                                                }
                                            ))
                                            Alert.alert('Erro', 'Erro ao conectar com o servidor');
                                        }
                                    }).catch((error) => {
                                        console.log(error);
                                    });
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

    let id = false;
    if (route.params != undefined) {
        id = route.params.id || false;
    } else {
        id = false;
    }



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
    if (id) {

        useEffect(() => {
            async function getItens() {
                const response = await fetch(`${basicUrl}mp/${id}`);
                const json = await response.json();
                //setQtd(response.data.qtd);
                //setPreco(response.data.preco);
                //setPrecoUn(response.res.precoUn);
            }
            getItens();
        }, []);
    }

    return (

        <ScrollView style={style.container}>
            {modalVisible ?
                <Verificar
                    data={[`Nome: ${nome} `,
                    'Data da Compra: ' + dataCompra.toLocaleDateString(),
                    'Validade: ' + validade.toLocaleDateString(),
                    `Quantidade: ${qtd} ${unMedida}`,
                    `Preço: R$${preco}`,
                    `Preço Unitário: R$${precoUn.toFixed(2)}/${unMedida}`]}
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
            <InputWithLabel value={qtd} onChangeText={text => setQtd(text)} label="Quantidade" type="numeric" />
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

            <InputWithLabel value={preco} onChangeText={t => setPreco(t)} label="Preço" type="numeric" />
            <Text style={{ fontSize: 20, margin: 5 }}>Preço Unitário: R${precoUn.toFixed(2)}/{unMedida}</Text>


            <TouchableOpacity
                style={style.button}
                onPress={() => {
                    if (nome == '' || dataCompra == null || validade == null || qtd == 0 || unMedida == '' || preco == 0) {
                        Alert.alert('Erro', 'Preencha todos os campos!');
                        return;
                    }
                    setModalVisible(true);
                    //navigation.replace('Matérias-Primas');
                }}
            >
                <Text style={style.buttonText}>Verificar</Text>
            </TouchableOpacity>
            <Padding value={40} />
        </ScrollView>
    )

}

const CadFormulacoes = (props) => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [numberPages, setNumberPages] = useState(1);
    const [actualPage, setActualPage] = useState(1);
    const [modalVisible, setModalVisible] = useState(false);
    const navigation = useNavigation();

    const Verificar = (props) => {
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

                        <Text style={style.text}>Nome: </Text>
                        <Text style={style.text}>Tipo: </Text>
                        <Text style={style.text}>Matérias-primas: </Text>
                        <FlatList
                            data={data}
                            renderItem={({ item }) => <Text key={item._id}>{item.nome} - {item.unMedida}</Text>}
                            keyExtractor={item => item.id}
                            ListFooterComponent={isLoading ? <ActivityIndicator /> : null}
                        />
                        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-around' }}>
                            <TouchableOpacity style={style.button}
                                onPress={() => {
                                    Alert.alert('Cadastro Concluídos', 'Text');
                                    setModalVisible(!modalVisible);
                                    navigation.replace('Formulações');
                                }}
                            >
                                <Text style={style.buttonText}>Salvar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{
                                ...style.button,
                                backgroundColor: 'gray'
                            }}
                                onPress={() => {
                                    setModalVisible(true);
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

    const getItens = async (page) => {
        if (page === 0 || page > numberPages) return;
        const p = page ?? 1;
        setIsLoading(true);
        setActualPage(p);
        try {
            const response = await fetch(basicUrl + 'mps' + '?p=' + p);
            const json = await response.json();
            setData(json.res);
            setNumberPages(json.n)
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getItens()
    }, []);

    const SearchItem = (props) => {
        const item = props.item
        const [isOpen, setIsOpen] = useState(false);

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

                }}

                >
                    <CheckBox
                        disabled={false}
                        value={isOpen}
                        onValueChange={(newValue) => setIsOpen(newValue)}
                    />
                    <Text style={{ fontSize: 20, marginLeft: 5 }}>{item.nome} - R$ {item.precoUn}/{item.unMedida}</Text>
                </View>
                {isOpen ? <>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'flex-end',

                    }}
                    >
                        <InputWithLabel
                            value={item.quantidade}
                            label={`Quantidade - ${item.quantidade}${item.unMedida} em Estoque`} type="numeric" />
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
    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState('');
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
                <TouchableOpacity
                    style={style.button}
                    onPress={() => {
                        setModalVisible(true);
                    }}
                >
                    <Text style={style.text}>Verificar</Text>
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
    const [descricao, setDescricao] = useState('');
    const [quantidade, setQuantidade] = useState(0);
    const [preco, setPreco] = useState(0);
    const [custo, setCusto] = useState('');
    const [date, setDate] = useState(null);



    const getFormulacoes = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://192.168.0.104:8080/newApi/forms');
            const json = await response.json();
            setData(json.res);

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        getFormulacoes();
    }, []);

    useEffect(() => {
        if (formulacao === '') return;
        setCusto('2')
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
                            return { label: item.nome, value: item.nome }
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
                    <InputWithLabel value={custo} label="Custo" type="numeric" disabled={true} />
                    <InputWithLabel onChangeText={t => setPreco(t)} value={preco} label="Preço de Venda" type="numeric" />
                    <InputWithLabel label="Quantidade" type="numeric" value={quantidade} onChangeText={t => setQuantidade(t)} />
                    <TouchableOpacity
                        style={style.button}
                        onPress={() => {
                            alert("Produto cadastrado com sucesso!")
                        }}
                    >
                        <Text style={style.text}>Salvar</Text>
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
        try {
            const response = await fetch(basicUrl + 'produtos' + '?p=' + p);
            const json = await response.json();
            setData(json.res);
            setNumberPages(json.n)
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
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
                        <InputWithLabel onChangeText={t => setQtd(t)} value={qtd} label={`Quantidade - ${item.unidades}`} type="numeric" />
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