import { Text, View, ActivityIndicator, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import style from "../assets/style";
import { useEffect, useState } from "react";
import ItemList from "./ItemList";
import BottomBar from "./BottomBar";
import { getDatabase, ref, get, onValue } from "firebase/database";
import firebase from "../services/firebaseConfig";
import { getAuth } from "firebase/auth";
import { AntDesign } from '@expo/vector-icons';
//import { useNavigation } from "@react-navigation/native";

export default function Lists(props) { //Componente que renderiza uma lista de itens, com base nos parâmetros passados por props
    const [loading, setLoading] = useState(true); // a fim de reutilizar o componente para diferentes listas
    const [data, setData] = useState({});         // e manter um padrão de estilo  
    const [dataLength, setDataLength] = useState(0);
    const [active, setActive] = useState(1);
    const [numberPages, setNumberPages] = useState(1);
    const db = getDatabase(firebase);
    const uid = getAuth().currentUser.uid;

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
                        getItens(props.i)
                    }}
                    style={styles.button}>
                    <Text style={{ fontSize: 20, marginBottom: 5 }}>{props.i}</Text>
                </TouchableOpacity>
            )
        }
    };

    const getItens = (page) => { //função que busca os itens no BD com base na url passada como props
        setLoading(true);
        const p = page ?? 1;
        const dbRef = ref(db, `data/${uid}/${props.url}`);
        //Implementar o onValue
        onValue(dbRef, (snapshot) => {
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
        });
    }

    const renderList = () => { //renderiza os itens na tela
        let arr = [];
        let i = (active - 1) * 10;
        let j = i + 10;
        if (dataLength == 0) {
            return <Text style={{ textAlign: 'center' }}>Nenhum item cadastrado</Text>
        }
        const values = Object.values(data);
        for (i; i < j; i++) {
            arr.push(<ItemList
                key={values[i]._id}
                format={props.format}
                data={values[i]}
            />);
            if (i == dataLength - 1) {
                break;
            }
        }
        numberPages > 1 ?
            arr.push(
                <View
                    key={i}
                    style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 5 }}
                >
                    {pagination({ n: numberPages })}
                </View>)
            : null
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

    useEffect(() => {
        setLoading(true);
        getItens();
    }, []);

    return (<>
        <View style={{ flex: 1 }}>
            <View style={style.container}>
                {loading ?
                    <ActivityIndicator size="large" color={style.colors.primaryDark} />
                    :
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {renderList()}
                        <TouchableOpacity
                            onPress={() => {getItens() }}
                            style={{
                                alignSelf: 'center',
                                ...styles.actButton,
                                marginBottom:70
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