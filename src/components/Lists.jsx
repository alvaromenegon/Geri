import { Text, View, ActivityIndicator, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import style from "../assets/style";
import { useEffect, useState } from "react";
import ItemList from "./ItemList";
import BottomBar from "./BottomBar";
import { getDatabase, ref, get, onValue } from "firebase/database";
import firebase from "../services/firebaseConfig";
import { getAuth } from "firebase/auth";
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { collection, getFirestore, onSnapshot, query, orderBy, limit, startAfter, getCountFromServer } from "firebase/firestore";
import { Select } from "./InputWithLabel";

export default function Lists(props) { //Componente que renderiza uma lista de itens, com base nos parâmetros passados por props
    const [loading, setLoading] = useState(true); // a fim de reutilizar o componente para diferentes listas
    const [data, setData] = useState({});         // e manter um padrão de estilo  
    const [dataLength, setDataLength] = useState(0);
    const [active, setActive] = useState(1);
    const [numberPages, setNumberPages] = useState(1);
    const [last, setLast] = useState(null);
    const [order, setOrder] = useState(['dataCompra', 'desc']);
    
    //const db = getDatabase(firebase);
    const database = getFirestore(firebase);
    const uid = getAuth().currentUser.uid;
    const navigation = useNavigation();

    const PaginationButton = (props) => {
        //Renderizar o botão de paginação
        if (props.active) {
            return (
                <View style={styles.actButton}>
                    <Text style={{ fontSize: 20, marginBottom: 5 }}>{props.i}</Text>
                </View>
            )
        }
        else {
            return (
                <TouchableOpacity key={props.i}
                    onPress={() => {
                        setActive(props.i)
                        let page = props.i;
                        if (page == 1) {
                            page = 0;
                        }
                        getItens(page)
                    }}
                    style={styles.button}>
                    <Text style={{ fontSize: 20, marginBottom: 5 }}>{props.i}</Text>
                </TouchableOpacity>
            )
        }
    };

    const getItens = async (page) => { //função que busca os itens no BD com base na url passada como props
        setLoading(true);
        //console.log(page)
        page = page ?? 0;
        //const dbRef = ref(db, `data/${uid}/${props.url}`);
        //Alterando para o Firestore

        const q =
            page == 0 ?
                query(
                    collection(database, `data/${props.url}/${uid}`),
                    orderBy(order[0], order[1]),
                    limit(10)
                ) :
                query(
                    collection(database, `data/${props.url}/${uid}`),
                    orderBy(order[0], order[1]),

                    limit(10),
                    startAfter(last)
                );

        //console.log(`data/${props.url}/${uid}`)
        const unSub = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs;
            const data = [];
            docs.forEach(doc => {
                data.push(doc.data());
            });
            setData(data);
            /*console.log('page: '+page)
            console.log('docs: '+docs.length)
            console.log(docs)
            setLast(docs[docs.length - 1]);
            console.log('last')
            console.log(docs[docs.length - 1])*/
            setLast(docs[docs.length - 1]);
            //console.log(data)
            //setNumberPages(Math.ceil(docs.length / 10));


            /*setData(snapshot.docs);
            setNumberPages(Math.ceil(docs.size / 10));
            console.log(data)*/
        });
        const countSnapshot = await getCountFromServer(collection(database, `data/${props.url}/${uid}`));
        const count = countSnapshot.data().count;
        setDataLength(count);
        setNumberPages(Math.ceil(count / 10));
        setLoading(false);
        return () => unSub();



        /*onValue(dbRef, (snapshot) => {
            try {
                if (snapshot.exists()) {
                    setData(snapshot.val())
                    setDataLength(snapshot.size)
                    setNumberPages(Math.ceil(snapshot.size / 10));
                } else {
                    console.warn('No data');
                    setData({});
                }
            }
            catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            };
        });*/
    }

    const renderList = () => { //renderiza os itens na tela
        let arr = [];
        let i = 0;
        const listLength = data.length;
        let j = listLength;
        if (listLength == 0) {
            return <Text style={{ textAlign: 'center' }}>Nenhum item cadastrado</Text>
        }
        for (i; i < j; i++) {
            arr.push(<ItemList
                key={data[i].firebaseID}
                format={props.format}
                data={data[i]}
            />);
            if (i == listLength - 1) {
                break;
            }
        }
        if (numberPages > 1) {
            arr.push(
                <View
                    key={i}
                    style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 5 }}
                >
                    {pagination({ n: numberPages })}
                </View>);
                arr.push(
                    <Text key='pgt' style={{ fontSize: 12, marginBottom: 10}}>{getPaginationText()}</Text>
                )
        }
        return arr;
    }

    const pagination = (props) => {
        let arr = [];
        for (let i = 1; i <= props.n; i++) {
            arr.push(
                <PaginationButton key={`btn${i}`} active={active === i} i={i} />
            );
        }
        return arr;
    }

    const getPaginationText = () => {
        let max = '';
        if (active * 10 > dataLength) {
            max = dataLength;
        }
        else {
            max = active * 10;
        }
        const text = `Exibindo ${active * 10 - 9} - ${max} de ${dataLength} itens`
        return text;
    }

    useEffect(() => {
        setLoading(true);
        getItens();

    }, []);

    const changeOrder = (value) => {
        setOrder(value);
        getItens();
    }


    const navegarPara = format => {
        return Enumerator = {
            'mps': 'Cadastrar Matéria-Prima',
            'form': 'Cadastrar Formulação',
            'prod': 'Cadastrar Produto',
            'venda': 'Cadastrar Saída'
        }[format]
    }

    return (<>
        <View style={{ flex: 1 }}>
            <View style={style.container}>

                {loading ?
                    <ActivityIndicator size="large" color={style.colors.primaryDark} />
                    :
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Select 
                        label="Ordenar por"  
                        value={order}
                        items={[
                            { label: 'Data de compra', value: ['dataCompra','desc'] },
                            { label: 'Nome (A-Z)', value: ['nome','asc'] },
                            { label: 'Nome (Z-A)', value: ['nome','desc'] },
                            { label: 'Data de validade (mais proxima)', value: ['dataValidade','asc'] },
                            { label: 'Data de validade (mais distante)', value: ['dataValidade','desc'] },
                        ]} onValueChange={(value) => { changeOrder(value) }} />

                        <TouchableOpacity
                            onPress={() => { navigation.navigate(navegarPara(props.format)) }}
                            style={{ alignSelf: 'flex-end', marginBottom: 10, borderColor: style.colors.primaryDark, borderWidth: 1, padding: 5, borderRadius: 5 }}
                        >
                            <Text style={{ fontSize: 18, color: 'black' }}>Cadastrar</Text>
                        </TouchableOpacity>
                        {renderList()}
                        <TouchableOpacity
                            onPress={() => { getItens() }}
                            style={{
                                alignSelf: 'center',
                                ...styles.actButton,
                                marginBottom: 70
                            }}
                        >
                            <AntDesign name="reload1" size={18} color={style.colors.primaryDark} />
                        </TouchableOpacity>
                    </ScrollView>
                }
            </View>

        </View>
        <BottomBar /></>
    )
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: style.colors.primaryDark,
        padding: 10,
        borderRadius: 5,
        margin: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
    },
    actButton: {
        backgroundColor: style.colors.primary,
        padding: 10,
        borderRadius: 5,
        margin: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
    }
});