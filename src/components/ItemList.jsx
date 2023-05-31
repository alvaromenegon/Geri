import { Text, View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { AntDesign } from '@expo/vector-icons';
import colors from "../assets/colors";
import { useState } from "react";
import { getDatabase, ref, remove } from "firebase/database";
import firebase from "../services/firebaseConfig";
import { getAuth } from "firebase/auth";
import { StackActions, useNavigation } from "@react-navigation/native";
//import { useNavigation } from "@react-navigation/native"; 

export default function ItemList(props) {
    const data = props.data;
    //console.log(data)
    const [open, setOpen] = useState(false);

    return (
        <View style={styles.itemList} >
            <View style={styles.itemListHeader}>
                <Text style={{ fontSize: 28, marginBottom: 5 }}>{props.format === 'venda' ? props.data.cliente + ' ' + new Date(props.data.data).toLocaleDateString('pt-BR') : props.data.nome}</Text>
                <TouchableOpacity
                    style={styles.btn}
                    onPress={() => {
                        setOpen(!open)
                    }}>
                    {open ?
                        <AntDesign name="caretup" size={20} color={colors.primaryDark} />
                        :
                        <AntDesign name="caretdown" size={20} color={colors.primaryDark} />}
                </TouchableOpacity>
            </View>
            {open ? //série de ifs encadeados para renderizar a tabela correta
                props.format === 'mp' ?
                    <TableMP data={data}></TableMP>
                    :
                    props.format === 'form' ?
                        <TableForm data={data}></TableForm>
                        :
                        props.format === 'prod' ?
                            <TableProd data={data}></TableProd>
                            :
                            props.format === 'venda' ?
                                <TableSaida data={data}></TableSaida>
                                :
                                <Text>Erro</Text>

                :
                props.format === 'mp' ?
                    <Text>Validade: {new Date(data.validade).toLocaleDateString('pt-BR')}</Text>
                    :
                    props.format === 'form' ?
                        <Text>{data.tipo} - R$ {data.custo}</Text>
                        :
                        props.format === 'prod' ?
                            null
                            :
                            props.format === 'venda' ?
                                <Text>Data: {
                                    new Date(data.data).toLocaleDateString('pt-BR')
                                }</Text>
                                : null
            }
        </View>
    )
}

const TableCell = (props) => {
    //const navigation = useNavigation();
    const navigation = useNavigation()
    if (props.buttons) {
        return (
            <View style={stylesTable.table}>
                <Text style={stylesTable.text}>{props.title}</Text>
                <View>
                <TouchableOpacity style={{
                    ...stylesTable.btn,
                    borderColor: colors.primaryDark, borderWidth: 1,
                    padding: 5, backgroundColor: colors.primaryLight, borderRadius: 5
                }}
                    onPress={() => {
                        alert('Não implementado')
                        /*try {
                            navigation.navigate('Gerenciar Matéria-Prima', { id: props.id })
                        }
                        catch (error) {
                            console.error(error);
                            alert('Houve um erro ao tentar acessar a tela de gerenciamento')
                        }*/
                    }
                    }
                >
                    <Text style={stylesTable.text}>Editar  <AntDesign name="edit" size={20} color={colors.primaryDark} /></Text>
                </TouchableOpacity>
                <TouchableOpacity style={{
                    ...stylesTable.btn,
                    borderColor: 'red', borderWidth: 1, margin:5,
                    padding: 5, backgroundColor: colors.primaryLight, borderRadius: 5
                }}
                    onPress={() => {
                        Alert.alert(
                            "Excluir",
                            "Deseja realmente excluir?",
                            [
                                {
                                    text: "Não",
                                    onPress: () => console.log("Cancel Pressed"),
                                    style: "cancel"
                                },
                                { text: "Sim", onPress: () => {
                                    remove(ref(getDatabase(firebase),`data/${getAuth().currentUser.uid}/mps/${props.id}`));
                                    navigation.dispatch(StackActions.popToTop());
                                    navigation.navigate('Matérias-Primas');
                                }}
                            ]
                        );}}>
                    <Text style={stylesTable.text}>Excluir   <AntDesign name="delete" size={20} color={'red'} /></Text>
                </TouchableOpacity>
                </View>
            </View>
        )
    }
    if (props.list) {
        return (
            <View style={{ ...stylesTable.table, flexDirection: 'column', alignItems: 'flex-start' }}>
                <Text style={stylesTable.text}>{props.title}</Text>
                {props.value.map((item, index) => {
                    return (
                        <Text key={index} style={{ ...stylesTable.table, width: '100%' }}>{item}</Text>
                    )
                })
                }
            </View>
        )
    }

    return (
        <View style={stylesTable.table}>
            <Text style={stylesTable.text}>{props.title}</Text>
            <Text style={stylesTable.text}>{props.value}</Text>
        </View>
    )
}

//Componentes específicos para cada tipo de Tabela

const TableMP = (props) => {
    const data = props.data;
    const preco = `R$ ${data.preco}`
    const precoUn = `R$ ${data.precoUn}/${data.unMedida}`
    const comprado = `${data.comprado} ${data.unMedida}`
    const quantidade = `${data.quantidade} ${data.unMedida}`
    const dataCompra = new Date(data.dataCompra).toLocaleDateString('pt-BR');
    const validade = new Date(data.validade).toLocaleDateString('pt-BR');
    return (
        <>
            <TableCell title='Nome' value={data.nome}></TableCell>
            <TableCell title='Preço' value={preco}></TableCell>
            <TableCell title='Data da Compra' value={dataCompra}></TableCell>
            <TableCell title='Validade' value={validade}></TableCell>
            <TableCell title='Preço Unitário'
                value={precoUn}
            ></TableCell>
            <TableCell title='Quantidade Comprada' value={comprado}></TableCell>
            <TableCell title='Quantidade Restante' value={quantidade}></TableCell>
            <TableCell title='Fornecedor' value={data.fornecedor}></TableCell>
            <TableCell title='Editar ou Excluir' id={data._id} buttons={true}></TableCell>

        </>
    )
}

const TableForm = (props) => {
    const data = props.data;
    const custo = `R$ ${data.custo}`
    let mps=[];
    Object.values(data.materiasprimas).forEach(element => {
        mps.push(`${element.nome} - ${element.quantidade} ${element.unMedida}`)
    });
    return (
        <>
            <TableCell title='Formulação' value={data.nome}></TableCell>
            <TableCell title='Tipo ' value={data.tipo}></TableCell>
            <TableCell title='Custo' value={custo}></TableCell>
            <TableCell title='Matérias-Primas' list={true} value={mps}></TableCell>
        </>
    )
}

const TableProd = (props) => {
    const data = props.data;
    const preco = `R$ ${data.preco.toFixed(2)}`
    const custo = `R$ ${data.custo.toFixed(3)}`
    //const validade = new Date(data.validade).toLocaleDateString('pt-BR');
    const dataFabricacao = new Date(data.data).toLocaleDateString('pt-BR');
    return (
        <>
            <TableCell title='Nome' value={data.nome}></TableCell>
            <TableCell title='Preço' value={preco}></TableCell>
            <TableCell title='Custo' value={custo}></TableCell>
            <TableCell title='Data de Fabricação' value={dataFabricacao}></TableCell>
            <TableCell title='Descrição' value={data.descricao}></TableCell>
            <TableCell title='Formulação' value={data.nomeFormulacao}></TableCell>
        </>
    )
}

const TableSaida = (props) => {
    const data = props.data;
    const date = new Date(data.data).toLocaleDateString('pt-BR', 'dd/MM/yyyy');
    const preco = `R$ ${data.preco}`;
    let produtos=[];
    Object.values(data.produtos).forEach(element => {
        produtos.push(`${element.nome}\nQuantidade: ${element.quantidade} - Total: R$${element.preco}`)
    });

    return (
        <>
            <TableCell title='Data' value={date}></TableCell>
            <TableCell title='Cliente' value={data.cliente}></TableCell>
            <TableCell title='Produtos' list={true} value={produtos}></TableCell>
            <TableCell title='Preço' value={preco}></TableCell>
            {data.naoVenda?
            <TableCell title='Tipo de Saída' value="Outros"></TableCell>:null}
        </>
    )
}

const stylesTable = StyleSheet.create({
    table: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 10,
        borderColor: colors.primaryDark,
        borderWidth: 1,
    },
    text: {
        fontSize: 20,
    }

});

const styles = StyleSheet.create({
    itemList: {
        backgroundColor: 'white',
        padding: 10,
        borderWidth: 1,
        borderColor: colors.primaryDark,
        marginBottom: 20,
        borderRadius: 5,
    },
    itemListHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemListBody: {
        backgroundColor: 'white',
        marginTop: 10,
    },
    btn: {
        backgroundColor: "transparent",
        borderColor: colors.primaryDark,
        borderWidth: 1,
        borderRadius: 25,
        padding: 5,
    }
});