import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { AntDesign } from '@expo/vector-icons';
import colors from "../assets/colors";
import style from '../assets/style.json';
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";

export default function ItemList(props) {

    const data = props.data;
    const [open, setOpen] = useState(false);

    return (
        <View style={styles.itemList} >
            <View style={styles.itemListHeader}>
                <Text style={{ fontSize: 28, marginBottom: 5 }}>{props.format === 'saida' ? props.data.tipo + ' ' + new Date(props.data.data).toLocaleDateString('pt-BR') : props.data.nome}</Text>
                <TouchableOpacity
                    style={styles.btn}
                    onPress={() => {
                        setOpen(!open)
                    }
                    }>
                    {open ?
                        <AntDesign name="caretup" size={20} color={colors.primaryDark} />
                        :
                        <AntDesign name="caretdown" size={20} color={colors.primaryDark} />}
                </TouchableOpacity>
            </View>
            {open ?
                props.format === 'mp' ?
                    <TableMP data={data}></TableMP>
                    :
                    props.format === 'form' ?
                        <TableForm data={data}></TableForm>
                        :
                        props.format === 'prod' ?
                            <TableProd data={data}></TableProd>
                            :
                            props.format === 'saida' ?
                                <TableSaida data={data}></TableSaida>
                                :
                                <Text>Erro</Text>

                :
                props.format === 'mp' ?
                    <Text>Validade: {data.validade}</Text>
                    :
                    props.format === 'form' ?
                        <Text>{data.tipo} - R$ {data.custo}</Text>
                        :
                        props.format === 'prod' ?
                            <Text>{data.validade}</Text>
                            :
                            props.format === 'saida' ?
                                <Text>Data: {
                                    new Date(data.data).toLocaleDateString('pt-BR')
                                    }</Text>
                                : null
            }
        </View>
    )
}

const TableCell = (props) => {
    const navigation = useNavigation();
    if (props.buttons) {
        return (
            <View style={stylesTable.table}>

                <Text style={stylesTable.text}>{props.title}</Text>
                <TouchableOpacity style={{
                    ...stylesTable.btn,
                    borderColor: colors.primaryDark, borderWidth: 1,
                    padding: 5, backgroundColor: colors.primaryLight, borderRadius: 5
                }}
                    onPress={() => {
                        try {
                            navigation.navigate('Gerenciar Matéria-Prima', { id: props.id })
                        }
                        catch (error) {
                            console.error(error);
                            alert('Houve um erro ao tentar acessar a tela de gerenciamento')
                        }
                    }
                    }
                >
                    <Text style={stylesTable.text}>Gerenciar  <AntDesign name="edit" size={20} color={colors.primaryDark} /></Text>

                </TouchableOpacity>
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

const TableMP = (props) => {
    const data = props.data;
    const preco = `R$ ${data.preco}`
    const precoUn = `R$ ${data.precoUn}/${data.unMedida}`
    const comprado = `${data.comprado} ${data.unMedida}`
    const quantidade = `${data.quantidade} ${data.unMedida}`
    //const comprado = new Date(data.dataCompra).toLocaleDateString('pt-BR');
    //const validade = new Date(data.validade).toLocaleDateString('pt-BR');
    return (
        <>
            <TableCell title='Nome' value={data.nome}></TableCell>
            <TableCell title='Preço' value={preco}></TableCell>
            <TableCell title='Data da Compra' value={data.dataCompra}></TableCell>
            <TableCell title='Validade' value={data.validade}></TableCell>
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
    return (
        <>
            <TableCell title='Formulação' value={data.nome}></TableCell>
            <TableCell title='Tipo ' value={data.tipo}></TableCell>
            <TableCell title='Custo' value={custo}></TableCell>
            <TableCell title='Matérias-Primas' value={data.materiasprimas}></TableCell>

        </>
    )
}

const TableProd = (props) => {
    const data = props.data;
    const preco = `R$ ${data.preco.toFixed(2)}`
    const custo = `R$ ${data.precoCusto.toFixed(3)}`
    const validade = typeof data.validade === 'string' ? data.validade : new Date(data.validade).toLocaleDateString('pt-BR');
    return (
        <>
            <TableCell title='Nome' value={data.nome}></TableCell>
            <TableCell title='Preço' value={preco}></TableCell>
            <TableCell title='Custo' value={custo}></TableCell>
            <TableCell title='Validade' value={validade}></TableCell>
            <TableCell title='Descrição' value={data.descricao}></TableCell>
            <TableCell title='Formulação' value={data.formulacao}></TableCell>
        </>
    )
}

const TableSaida = (props) => {
    const data = props.data;

    const date = new Date(data.data).toLocaleDateString('pt-BR', 'dd/MM/yyyy');
    const preco = `R$ ${data.preco}`

    return (
        <>
            <TableCell title='Data' value={date}></TableCell>
            <TableCell title='Produtos' value={data.nomeProdutos}></TableCell>
            <TableCell title='Quantidade' value={data.quantidade}></TableCell>
            <TableCell title='Preço' value={preco}></TableCell>
            <TableCell title='Tipo' value={data.tipo}></TableCell>

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