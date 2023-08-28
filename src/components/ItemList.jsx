import { Text, View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { AntDesign } from '@expo/vector-icons';
import colors from "../assets/colors";
import { useState } from "react";
import { getDatabase, ref, remove } from "firebase/database";
import firebase from "../services/firebaseConfig";
import { getAuth } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import * as Print from 'expo-print';
import getHtml from "../services/getHtml";
import { Feather } from '@expo/vector-icons';
import gerarPlanilha from "../services/gerarPlanilha";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import style from '../assets/style.json'

export default function ItemList(props) {
    const data = props.data;
    const format = props.format;
    const [open, setOpen] = useState(false);

    return (
        <View style={styles.itemList} >
            {(format !== 'venda' && format !== 'form' && data.quantidade < 1) &&
                <View style={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'red', padding: 5, borderRadius: 5 }}>
                </View>
            }
            <View style={styles.itemListHeader}>
                <Text style={{ fontSize: 28, marginBottom: 5 }}>{format === 'venda' ? props.data.cliente + ' ' + new Date(props.data.data).toLocaleDateString('pt-BR') : props.data.nome}</Text>
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
                format === 'mp' ?
                    <TableMP data={data}></TableMP>
                    :
                    format === 'form' ?
                        <TableForm data={data}></TableForm>
                        :
                        format === 'prod' ?
                            <TableProd data={data}></TableProd>
                            :
                            format === 'venda' ?
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
    const navigation = useNavigation();
    const pageName = navigation.getState().routes[navigation.getState().routes.length - 1].name;
    const url = props.url
    if (props.buttons) {
        return (
            <View style={stylesTable.table}>
                <Text style={stylesTable.text}>{props.title}</Text>
                <View style={{width:'45%'}}>
                    <TouchableOpacity style={style.buttonTableCell}                       
                        onPress={() => {
                            Alert.alert('Em breve.')
                            /*try {
                                navigation.navigate('Gerenciar Matéria-Prima', { id: props.id })
                            }
                            catch (error) {
                                console.error(error);
                                alert('Houve um erro ao tentar acessar a tela de gerenciamento')
                            }*/
                        }}>
                        <Text style={stylesTable.text}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{...style.buttonTableCell,
                    backgroundColor:'#ffb3b3'    
                }}
                        onPress={() => {
                            Alert.alert(
                                "Excluir",
                                "Deseja realmente excluir?",
                                [
                                    {
                                        text: "Não",
                                        style: "cancel"
                                    },
                                    {
                                        text: "Sim", onPress: () => {
                                            navigation.replace(pageName)
                                            remove(ref(getDatabase(firebase), `data/${getAuth().currentUser.uid}/${url}`));

                                        }
                                    }
                                ]
                            );
                        }}>
                        <Text style={{...stylesTable.text, color:'black'}}>Excluir</Text>
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
    if (props.export) {
        const type = props.type || 'pdf'
        const print = async () => {
            const nome = props.data.nome;
            const preco = props.data.preco;
            const id = props.data.id;
            const descricao = props.data.descricao;
            const validade = props.data.validade;
            const html = getHtml(nome, preco, descricao, validade, id);
            const options = {
                html: html,
                fileName: props.title,
                directory: 'Documents',
            };
            await Print.printAsync(options);
        }

        return (
            <View style={stylesTable.table}>
                <Text style={stylesTable.text}>{props.title}</Text>{
                    type === 'pdf' ?

                        <View style={{width:'45%'}}>
                            <TouchableOpacity style={style.buttonTableCell}
                                onPress={() => print()}
                            >
                                <Text style={stylesTable.text}>Salvar</Text>
                            </TouchableOpacity>

                        </View> :
                        <View style={{width:'45%'}}>
                            <TouchableOpacity style={style.buttonTableCell}
                                onPress={() => gerarPlanilha(props.data, props.name, 'formulacao', 'save')}
                            >
                                <Text style={stylesTable.text}>Salvar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={style.buttonTableCell}
                                onPress={() => gerarPlanilha(props.data, props.name, 'formulacao', 'share')}
                            >
                                <Text style={stylesTable.text}>Compartilhar</Text>
                            </TouchableOpacity>
                        </View>

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
            <TableCell title='Editar ou Excluir' url={`mps/${data._id}`} buttons={true}></TableCell>

        </>
    )
}

const TableForm = (props) => {
    const data = props.data;
    const custo = `R$ ${data.custo}`
    let mps = [];
    Object.values(data.materiasprimas).forEach(element => {
        mps.push(`${element.nome} - ${element.quantidade} ${element.unMedida}`)
    });
    return (
        <>
            <TableCell title='Formulação' value={data.nome}></TableCell>
            <TableCell title='Tipo ' value={data.tipo}></TableCell>
            <TableCell title='Custo' value={custo}></TableCell>
            <TableCell title='Matérias-Primas' list={true} value={mps}></TableCell>
            <TableCell title='Gerar Planilha' export={true} type='xlsx' data={data.materiasprimas} />
            <TableCell title='Editar ou Excluir' url={`forms/${data._id}`} buttons={true}></TableCell>
        </>
    )
}

const TableProd = (props) => {
    const data = props.data;
    const preco = `R$ ${data.preco.toFixed(2)}`
    const custo = `R$ ${data.custo.toFixed(3)}`

    const validade = new Date(data.validade).toLocaleDateString('pt-BR');
    const dataFabricacao = new Date(data.data).toLocaleDateString('pt-BR');
    return (
        <>
            <TableCell title='Nome' value={data.nome}></TableCell>
            <TableCell title='Preço' value={preco}></TableCell>
            <TableCell title='Custo' value={custo}></TableCell>
            <TableCell title='Data de Fabricação' value={dataFabricacao}></TableCell>
            <TableCell title='Validade' value={validade}></TableCell>
            <TableCell title='Estoque' value={data.quantidade}></TableCell>
            <TableCell title='Descrição' value={data.descricao}></TableCell>
            <TableCell title='Formulação' value={data.nomeFormulacao}></TableCell>
            <TableCell title='Exportar para PDF' data={{ nome: data.nome, preco: preco, descricao: data.descricao, validade: validade, id: data._id }} export={true}></TableCell>
            <TableCell title='Excluir' url={`produtos/${data._id}`} buttons={true}></TableCell>
        </>
    )
}

const TableSaida = (props) => {
    const data = props.data;
    const date = new Date(data.data).toLocaleDateString('pt-BR', 'dd/MM/yyyy');
    const preco = `R$ ${data.preco}`;
    let produtos = [];
    Object.values(data.produtos).forEach(element => {
        produtos.push(`${element.nome}\nQuantidade: ${element.quantidade} - Total: R$${element.preco}`)
    });

    return (
        <>
            <TableCell title='Data' value={date}></TableCell>
            <TableCell title='Cliente' value={data.cliente}></TableCell>
            <TableCell title='Produtos' list={true} value={produtos}></TableCell>
            <TableCell title='Preço' value={preco}></TableCell>
            {data.naoVenda ?
                <TableCell title='Tipo de Saída' value="Outros"></TableCell> : null}
            <TableCell title='Editar ou Excluir' url={`vendas/${data._id}`} buttons={true}></TableCell>
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