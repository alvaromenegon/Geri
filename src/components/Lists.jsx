import { Text, View, ActivityIndicator, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import style from "../assets/style";
import { useEffect, useState } from "react";
import ItemList from "./ItemList";
import BottomBar from "./BottomBar";
import { getDatabase, ref, get } from "firebase/database";
import firebase from "../services/firebaseConfig";
import { getAuth } from "firebase/auth";

export default function Lists(props) {
    if (props.format !== 'mp' &&
        props.format !== 'form' &&
        props.format !== 'prod' &&
        props.format !== 'saida') {
        return <Text>Houve um erro, por favor contate o suporte</Text>
    }

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
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

    const getItens = async (page) => {
        const p = page ?? 1;
        setLoading(true);
        get(ref(db, `data/${uid}/${props.url}/`)).then((snapshot) => {
            if (snapshot.exists()) {
                setData(snapshot.val());
            } else {
                console.warn('No data available');
                setData([null]);
            }
        })
        .catch((error) => {
            console.error(error);
        }
        )
        .finally(() => {
            setLoading(false);
        }
        );        
    };

    const renderList = () => {
        let arr = [];
        let i = 0;
        if (data[0] == null){
            return <Text style={{textAlign:'center'}}>Nenhum item cadastrado</Text>
        }
        for (i; i < data.length; i++) {
            arr.push(<ItemList
                key={i}
                format={props.format}
                data={data[i]}
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
        let arr = [];
        for (let i = 1; i <= props.n; i++) {
            arr.push(
                <PaginationButton key={`btn${i}`} active={active === i} i={i} />
            );
        }
        return arr;
    }

    useEffect(() => {
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