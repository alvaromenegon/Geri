import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import colors from '../assets/colors.json';
import style from '../assets/style.json';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storeData } from './Listagens';
import { ScrollView } from 'react-native';
import BottomBar from '../components/BottomBar';
import Padding from '../components/Padding';



function Main() {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [avisos, setAvisos] = useState({});
    const [recentes, setRecentes] = useState([]);

    const getUser = async () => {
        setLoading(true);
        try {
            const value = await AsyncStorage.getItem('login')
            if (value !== null) {
                setUsername(value);
            }
            else {
                console.error('erro ao pegar login');
            }
        } catch (error) {
            console.error(error);
        }
    }

    const getAvisos = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://192.168.0.104:8080/newApi/start');
            const json = await response.json();
            setAvisos(json.res);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const renderAvisos = () => {
        if (avisos.length === 0) {
            return (
                <Text>Não há avisos</Text>
            )
        }
        let arr = [];
        if (avisos.mp) arr.push(<Text style={styles.text} key={0}>Há matérias-primas sem estoque.</Text>);
        if (avisos.prod) arr.push(<Text style={styles.text} key={1}>Há produtos sem estoque.</Text>);

        return arr;
    }


    const getRecentes = async () => {
        let arr = [];
        var i = 1
        for (i=0; i < 5; i++) {
            try {
                const recent = await AsyncStorage.getItem('recent' + i);
                if (recent !== null) {
                    arr.push(
                        <TouchableOpacity
                            key={'bt' + i}
                            style={{...style.button,maxWidth:'80%'}}
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
    }

    const renderRecentes = () => {
        return recentes;
    }

    useEffect(() => {
        setLoading(true);
        navigation.addListener('focus', () => {
            getRecentes();
        });
        getUser();
        getAvisos();
        setLoading(false);
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
                <View style={{ flex: 1, marginBottom:25 }}>
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
            <Padding/>
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