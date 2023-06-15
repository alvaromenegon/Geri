import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import colors from '../assets/colors.json';
import style from '../assets/style.json';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storeData } from './Listagens';
import { ScrollView } from 'react-native';
import Padding from '../components/Padding';
import { getAuth, signOut } from 'firebase/auth';
import { getDatabase, ref, get } from 'firebase/database';
import { Alert } from 'react-native';
import firebase from '../services/firebaseConfig';

function Main() {
    const navigation = useNavigation();
    const db = getDatabase(firebase);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [uid, setUid] = useState('');
    const [avisos, setAvisos] = useState({});
    const [recentes, setRecentes] = useState([]);

    const getUser = async () => {
        setLoading(true);
        try {
            const value = await AsyncStorage.getItem('user')
            if (value === null) {
                Alert.alert('Erro', 'Houve um erro ao fazer login - Por favor contate o suporte');
                signOut(getAuth());
                navigation.replace('Login');
            }
            setUsername(JSON.parse(value).nome);
            setUid(JSON.parse(value).uid);

        } catch (error) {
            Alert.alert('Erro', 'Houve um erro ao recuperar os dados - Por favor contate o suporte');
            signOut(getAuth());
            navigation.replace('Login');
        } finally {
            setLoading(false);
        }
    }

    const getAvisos = () => { //buscar os avisos no BD
        setLoading(true);
        const dbRef = ref(db, `data/${uid}/avisos`)
        get(dbRef).then((snapshot) => {
            if (snapshot.exists()) {
                setAvisos(snapshot.val());
            } else {
                Alert.alert('Erro', 'Não foi possível conectar ao banco de dados');
                console.warn('No data available');
                setAvisos({});
            }
        })
            .catch((error) => {
                get(ref(db, `data/${getAuth().currentUser.uid}/avisos`)).then((snapshot) => {
                    if (snapshot.exists()) {
                        setAvisos(snapshot.val());
                    } else {
                        Alert.alert('Erro', 'Não foi possível conectar ao banco de dados');
                        console.warn('No data available');
                        setAvisos({});
                    }
                }).catch((error) => {
                    console.error(error);
                    Alert.alert('Erro', 'Houve um erro na autenticação com o banco de dados - Por favor contate o suporte')
                })
            })
            .finally(() => {
                setLoading(false);
            });
    }

    const renderAvisos = () => { //renderizar os avisos
        if (!avisos.noMp && !avisos.noProd) {
            return (
                <Text>Está tudo em dia</Text>
            )
        }
        let arr = [];
        if (avisos.noMp) arr.push(<Text style={styles.text} key={0}>Há matérias-primas sem estoque.</Text>);
        if (avisos.noProd) arr.push(<Text style={styles.text} key={1}>Há produtos sem estoque.</Text>);
        return arr;
    }

    const getRecentes = async () => {//responsável por buscar os itens
        let arr = [];               // no firebase
        const snapshot = await get(ref(db, `data/${getAuth().currentUser.uid}/recentes`));
        if (!snapshot.exists()) {
            arr.push(
                <View key={0} style={{ justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                    <Text style={style.text} key={1}>Ainda não há itens recentes,
                        utilize o menu lateral para navegar.</Text>
                </View>
            )
            setRecentes(arr);
            return true;
        }
        const values = Object.entries(snapshot.val())

        for (let i = 0; i < values.length; i++) {
            if (values[i][0] === 'last') break;
            arr.push(
                <TouchableOpacity
                    key={'bt' + i}
                    style={{ ...style.button, maxWidth: '80%' }}
                    onPress={
                        () => {
                            navigation.navigate(values[i][1]);
                        }
                    }>
                    <Text style={style.textButton}>{values[i][1]}</Text>
                </TouchableOpacity>
            )
        }
        setRecentes(arr);
        return true;
    }


    /*for (i = 0; i < 5; i++) {
        try {
            const recent = await AsyncStorage.getItem('recent' + i);
            if (recent !== null) {
                arr.push(
                    <TouchableOpacity
                        key={'bt' + i}
                        style={{ ...style.button, maxWidth: '80%' }}
                        onPress={
                            () => {
                                storeData(recent).then(() => {
                                    navigation.navigate(recent);
                                });
                            }
                        }>
                        <Text style={style.textButton}>{recent}</Text>
                    </TouchableOpacity>
                )
            }
        }
        catch (e) {
            console.error(e);
        }
    }
    if (arr.length === 0)
        arr.push(
            <View key={0} style={{ justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                <Text style={style.text} key={1}>Ainda não há itens recentes,
                    utilize o menu lateral para navegar.</Text>
            </View>
        )
    setRecentes(arr);
    return true;
}*/

    const renderRecentes = () => {
        return recentes;
    }

    navigation.addListener('focus', () => {
        getRecentes();
    });

    useEffect(() => {
        setLoading(true);
        getUser().then(() => {
            getAvisos();
            getRecentes()
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    const Avisos = () => {
        return (
            <>
                <View style={{
                    width: '25%',
                    backgroundColor: 'white',
                    marginLeft: 10,
                    marginTop: 10,
                    borderTopRightRadius: 10,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <Text style={styles.text}>Avisos</Text>
                </View>
                <View style={styles.avisos}>
                    {renderAvisos()}
                </View>
            </>
        )
    }

    return (
        <ScrollView style={style.container}>
            {loading ?
                <ActivityIndicator size="large" color={colors.primary} /> :
                <View style={{ flex: 1, marginBottom: 25 }}>
                    <Text style={styles.mainText}>Bem-vindo {username}</Text>
                    <Avisos />
                    <View style={styles.recentes}>
                        <Text style={styles.text}>Acessados recentemente</Text>
                        <View style={{
                            marginTop: 10,
                            paddingTop: 20,
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                        }}>
                            {renderRecentes()}
                        </View>
                    </View>
                </View>
            }
            <Padding />
        </ScrollView>
    )
}


const styles = StyleSheet.create({
    main: {
        flex: 1,
        backgroundColor: colors.primaryLight,
    },
    text: {
        fontSize: 24,
    },
    mainText: {
        margin: 15,
        marginBottom: 30,
        fontSize: 26,
        alignSelf: 'center'
    },
    avisos: {
        minHeight: 100,
        backgroundColor: 'white',
        margin: 10,
        marginTop: 0,
        borderRadius: 10,
        borderTopLeftRadius: 0,
        padding: 10,

    },
    recentes: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 10,
        marginTop: 50
    },
});


export default Main;