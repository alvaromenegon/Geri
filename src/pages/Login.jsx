import { Text, View, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from "react";
import style from "../assets/style.json";
import { InputWithLabel } from "../components/InputWithLabel";
import firebase from "../services/firebaseConfig";

/*const encrypt = (senha) => {
    var crypto = require('expo-crypto');
    não implementado
    return hash;
}*/
function NewLogin(){
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [err, setErr] = useState(false);
    const navigation = useNavigation();

    const logar = async () => {
        var data;
        try{
            await firebase.auth()
        }
        catch(e){
        }
        if (email !== '' && senha !== '') {
            //console.log(encrypt(senha))
            
            await firebase.auth().signInWithEmailAndPassword(email, senha)
            .then((userCredential) => {
                // Signed in
                var user = userCredential.user;
                console.log(user);
                navigation.replace('Controle');
                // ...
            })
            .catch((error) => {
                var errorCode = error.code;
                var errorMessage = error.message;
                console.log(errorMessage);
                Alert.alert('Erro ao fazer login', 'Usuário ou senha incorreta');
            });
        }
        else {
            Alert.alert('Erro', 'Usuário ou senha inválidos');
            return false;
        }
    }

    return(
        <View style={style.container}>
            <View style={{}} >
                <View style={{ height: 180 }}>
                    <InputWithLabel label="E-mail" type="email-address" value={email} onChangeText={t => setEmail(t)} />
                    <InputWithLabel label="Senha" value={senha} onChangeText={t => setSenha(t)} secure={true} />
                </View>
                <TouchableOpacity

                    onPress={() => { alert('Não implementado') }}>
                    <Text style={{ fontSize: 14, marginLeft:5 }}>Esqueci minha senha</Text>
                </TouchableOpacity>
                <View
                    style={{
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        marginTop: 30,
                    }}
                ><TouchableOpacity  
                style={style.button}
                onPress={() => { logar() }}
                >
                    <Text style={style.textButton} >Entrar</Text>
                </TouchableOpacity>
                    {
                        err ?
                            <Text>Erro ao salvar dados</Text>
                            :
                            null
                    }
                    <TouchableOpacity
                        onPress={() => { navigation.navigate('Cadastro') }}>
                        <Text style={style.text}>Cadastrar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>




    )
}

function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [err, setErr] = useState(false);
    const navigation = useNavigation();
    const url = 'http://192.168.0.104:8080/newapi/login';


    const storeData = async (login, email, senha) => {
        try {
            await AsyncStorage.setItem('user',
                JSON.stringify({
                    login: login,
                    email: email,
                })
            )
        } catch (e) {
            setErr(true);
            console.error(e);
        } finally {
            !err?
            navigation.replace('Controle'):
            alert('Erro ao salvar dados');
        }
    }

    const logar = async () => {
        var data;
        if (email !== '' && senha !== '') {
            //console.log(encrypt(senha))
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    senha: senha
                })
            });
            data = await response.json();
            if (data.res !== false && data.res != undefined) {
                await storeData(data.res, email, senha);
                navigation.replace('Controle');
                return true;
            }
            Alert.alert('Erro ao fazer login', 'Usuário ou senha incorreta');
            return false;
        }
        else {
            Alert.alert('Erro', 'Usuário ou senha inválidos');
            return false;
        }
    }

    useEffect(() => {
        const getData = async () => {
            try {
                const value = await AsyncStorage.getItem('user')
                const prevUser = await AsyncStorage.getItem('prevUser');
                if (value !== null && value !== undefined) {
                    // value previously stored
                    navigation.replace('Controle');
                }
                if (prevUser !== null) {
                    setEmail(JSON.parse(prevUser).email);
                }
            } catch (e) {
                console.error(e);
            }
        }
        getData();
    }, []);


    return (
        <View style={style.container}>
            <View style={{}} >
                <View style={{ height: 180 }}>
                    <InputWithLabel label="E-mail" type="email-address" value={email} onChangeText={t => setEmail(t)} />
                    <InputWithLabel label="Senha" value={senha} onChangeText={t => setSenha(t)} secure={true} />
                </View>
                <TouchableOpacity
                    onPress={() => { alert('Não implementado') }}>
                    <Text style={{ fontSize: 14, marginLeft:5 }}>Esqueci minha senha</Text>
                </TouchableOpacity>
                <View
                    style={{
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        marginTop: 30,
                    }}
                >

                    <TouchableOpacity
                        style={style.button}
                        onPress={() => { logar() }}
                    >
                        <Text style={style.textButton} >Entrar</Text>
                    </TouchableOpacity>

                    {
                        err ?
                            <Text>Erro ao salvar dados</Text>
                            :
                            null
                    }
                    <TouchableOpacity
                        onPress={() => { navigation.navigate('Cadastro') }}>
                        <Text style={style.text}>Cadastrar</Text>
                    </TouchableOpacity>
                </View>
            </View>



        </View>

    )
}

export default Login;
