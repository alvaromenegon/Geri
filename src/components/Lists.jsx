import { Text, View, ActivityIndicator, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import style from "../assets/style";
import { useEffect, useState } from "react";
import ItemList from "./ItemList";
import BottomBar from "./BottomBar";
import { getDatabase, ref, get } from "firebase/database";
import firebase from "../services/firebaseConfig";
import { getAuth } from "firebase/auth";
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";

export default function Lists(props) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({});
    const [dataLength, setDataLength] = useState(0);
    const [active, setActive] = useState(1);
    const [numberPages, setNumberPages] = useState(1);
    const db = getDatabase(firebase);
    const uid = getAuth().currentUser.uid;

    const PaginationButton = (props) => {
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
                    style={styles.button}
                >
                    <Text style={{ fontSize: 20, marginBottom: 5 }}>{props.i}</Text>
                </TouchableOpacity>
            )
        }
    };

    const getItens = (page) => {
        setLoading(true);
        //const p = page ?? 1;
        const dbRef = ref(db, `data/${uid}/${props.url}`);
        //Implementar o onValue
        get(dbRef).then((snapshot) => {
            if (snapshot.exists()) {
                setData(snapshot.val())
                setDataLength(snapshot.size)
                setNumberPages(Math.ceil(data.length / 10));
            } else {
                console.warn('No data');
                setData({});
            }
        })
        .catch((error) => {
            console.error(error);
        }).finally(() => {
            setLoading(false);
        });
        return true;
    };

    const renderList = () => {
        let arr = [];
        let i = 0;
        if (dataLength == 0) {
            return <Text style={{ textAlign: 'center' }}>Nenhum item cadastrado</Text>
        }
        for (i; i < dataLength; i++) {
            arr.push(<ItemList
                key={i}
                format={props.format}
                data={Object.values(data)[i]}
            />);
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
        //Corrigir
        //botões nao aparecem
        //todos os item aparecem na primeira pagina
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

    return (
        <View style={{ flex: 1 }}>
            <View style={style.container}>

                {loading ?
                    <ActivityIndicator size="large" color={style.colors.primaryDark} />
                    :
                    <ScrollView showsVerticalScrollIndicator={false}>
                        
                        {renderList()}
                        <TouchableOpacity
                            onPress={() =>getItens()}
                            style={{ alignSelf: 'center',
                            ...styles.actButton
                         }}
                        >
                            <AntDesign name="reload1" size={18} color={style.colors.primaryDark} />
                        </TouchableOpacity>
                    </ScrollView>
                    
                }
            </View>
            <BottomBar />
        </View>
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