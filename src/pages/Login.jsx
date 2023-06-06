import { Text, View, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from "react";
import style from "../assets/style.json";
import { InputWithLabel } from "../components/InputWithLabel";
import firebase from '../services/firebaseConfig';
import { signInWithEmailAndPassword, getAuth, signOut, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { get, getDatabase, ref } from "firebase/database";

function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [err, setErr] = useState(false);
    const navigation = useNavigation();
    const db = getDatabase(firebase);

    const logar = () => {
        const auth = getAuth();
        if (email !== '' && senha !== '') {
            signInWithEmailAndPassword(auth, email, senha)
                .then((userCredential) => {
                    /*if (userCredential.user.emailVerified !== true) { 
                        Alert.alert('Erro', 'Email não verificado\n' +
                            'Verifique sua caixa de entrada e spam');
                        signOut(auth);
                        return false;
                    }*/
                    // Signed in
                    var user = userCredential.user;
                    if (user.displayName === null && user.uid !== null) {
                        get(ref(db, `usuarios/${user.uid}`)).then((snapshot) => {
                            if (snapshot.exists()) {
                                const data = snapshot.val();
                                user.displayName = data.nome;
                                updateProfile(user, {
                                    displayName: data.nome,
                                }).then(() => {
                                }).catch((error) => {
                                    Alert.alert('Erro', 'Houve um erro ao cadastrar o nome do usuário');
                                    console.log('error update profile');
                                    console.log(error);
                                });
                            } else {
                                console.warn('No data available');
                                setUsername('');
                            }
                        })
                            .catch((error) => {
                                console.error('Error getting data')
                                console.error(error);
                            })
                    }

                    AsyncStorage.setItem('user', JSON.stringify(
                        {
                            email: user.email,
                            uid: user.uid,
                            nome: user.displayName,
                        }
                    )).then(() => {
                        navigation.replace('Geri');
                    });
                })
                .catch((error) => {
                    var errorCode = error.code;
                    if (errorCode === 'auth/wrong-password')
                        Alert.alert('Erro ao fazer login', 'Usuário ou senha incorreta')
                    else {
                        Alert.alert('Erro ao fazer login', 'O email não foi cadastrado');
                        setEmail('');
                        setSenha('');
                    }
                });
        }
        else {
            Alert.alert('Erro', 'Usuário ou senha inválidos');
            return false;
        }
    }

    useEffect(() => {
        try {
            const currentUser = getAuth().currentUser;    
            AsyncStorage.getItem('user').then((value) => {
                if (value !== null) {
                    const user = JSON.parse(value);
                    if (currentUser !== null && currentUser.uid !== null && currentUser.uid === user.uid) {
                        navigation.replace('Geri');
                        return currentUser.uid;
                    }   
                }
            });
            
            AsyncStorage.getItem('prevUser').then((value) => {
                if (value !== null) {
                    setEmail(value);
                }
            });
        } catch (e) {
            console.error(e);
        }
    }, []);


    return (
        <View style={style.container}>
            <View>
                <View style={{ height: 180 }}>
                    <InputWithLabel label="E-mail" type="email-address" value={email} onChangeText={t => setEmail(t)} />
                    <InputWithLabel label="Senha" value={senha} onChangeText={t => setSenha(t)} secure={true} />
                </View>
                <TouchableOpacity
                    onPress={() => { sendPasswordResetEmail(getAuth(),email);
                                    Alert.alert('Verifique seu e-mail',
                                    'Um link para redefinir sua senha foi enviada para o seu e-mail') }}>
                    <Text style={{ fontSize: 14, marginLeft: 5 }}>Esqueci minha senha</Text>
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
