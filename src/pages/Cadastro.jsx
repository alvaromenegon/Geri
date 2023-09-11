import { useState } from 'react';
import { Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import style from '../assets/style.json';
import { useNavigation } from '@react-navigation/native';
import { InputWithLabel } from '../components/InputWithLabel';
import { createUserWithEmailAndPassword, getAuth, sendEmailVerification, signOut, updateProfile } from 'firebase/auth';
import { getDatabase, ref, set } from "firebase/database";
import AsyncStorage from '@react-native-async-storage/async-storage';
const db = getDatabase();
//Login com Google= https://firebase.google.com/docs/auth/web/google-signin?hl=pt-br

export const Cadastro = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [nome, setNome] = useState('');
    const navigation = useNavigation();

    const cadastrar = async () => {
        setIsLoading(true);
        if (nome === '' || email === '' || senha === '' || confirmarSenha === '') {
            alert('Preencha todos os campos');
            setIsLoading(false);
            return;
        }
        if (senha !== confirmarSenha) {
            alert('Senhas não conferem');
            setIsLoading(false);
            return;
        }
        if (senha.length < 6) {
            alert('Senha deve ter no mínimo 6 caracteres');
            setIsLoading(false);
            return;
        }
        if (email.indexOf('@') === -1 || email.indexOf('.com') === -1) {
            alert('E-mail inválido');
            setIsLoading(false);
            return;
        }
        const auth = getAuth();
        createUserWithEmailAndPassword(auth, email, senha)
            .then((userCredential) => {
                const user = userCredential.user;
                updateProfile(auth.currentUser, {
                    displayName: nome,
                }).then(() => {
                    sendEmailVerification(auth.currentUser)
                    .then(() => {
                        // Email verification sent!
                        Alert.alert('Verifique seu e-mail', 'Um e-mail de verificação foi enviado para ' + email);
                    })
                })
                    .then(() => { //cria uma entrada no BD apenas com o nome e o e-mail do usuário
                        set(ref(db, 'usuarios/' + user.uid), {
                            nome: nome,
                            email: email,
                        }).then(() => { //e cria as demais informações como filho do nó /data/ 
                            set(ref(db, `data/${user.uid}`), { //onde o acesso é restrito a usuários autenticados
                                avisos: {
                                    noMp: false,
                                    noProd: false,
                                },
                                mps: "",
                                forms: "",
                                produtos: "",
                                vendas: "",
                                temp: "",
                                faturamento: {
                                    entradas:"",
                                    saidas:"",
                                },
                                recentes: "",
                            })
                        })
                            .catch((error) => {
                                console.error(error);
                            });
                    }).then(() => {
                        AsyncStorage.removeItem('user') //remove os dados locais do outro usuário, caso houver
                    })
                    .then(() => {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });

                        //navigation.replace('Login');
                    })
                    
                // ...
            })
            .catch((error) => {
                console.log(error)
                const errorCode = error.code;
                if (errorCode === 'auth/email-already-in-use') {
                    Alert.alert('Não foi possível cadastrar', 'Esse E-mail já foi cadastrado');
                    return;
                }
                const errorMessage = error.message;
                alert(errorMessage);
                // ..
            });

        setIsLoading(false);
    }
    return (
        <ScrollView style={{ ...style.container }}>
            <InputWithLabel value={nome} label="Nome" onChangeText={text => setNome(text)} placeholder="Nome" />
            <InputWithLabel value={email} label="E-mail" onChangeText={text => setEmail(text)} placeholder="E-mail" keyboardType='email-address' />
            <InputWithLabel value={senha} label="Senha" onChangeText={text => setSenha(text)} placeholder="Senha" secure={true} />
            <InputWithLabel value={confirmarSenha} label="Confirmar senha" onChangeText={text => setConfirmarSenha(text)} placeholder="Confirmar senha" secure={true} />

            <TouchableOpacity
                style={{ ...style.button, marginBottom: 60, alignSelf: 'center' }}
                onPress={() => { cadastrar() }}

            >
                {isLoading ? <ActivityIndicator size="small" color="#fff" /> :
                    <Text style={style.textButton}>Cadastrar</Text>}
            </TouchableOpacity>
        </ScrollView>
    )
}