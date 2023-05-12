import { useState } from 'react';
import { Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import style from '../assets/style.json';
import { useNavigation } from '@react-navigation/native';
import { InputWithLabel } from '../components/InputWithLabel';
import { createUserWithEmailAndPassword } from 'firebase/auth';

/*const encrypt = (senha) => {
    implementar
}*/
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
                // Signed in
                const user = userCredential.user;
                user.updateProfile({
                    displayName: nome,
                }).then(() => {
                    
                }).catch((error) => {
                    Alert.alert(
                        'Erro ao atualizar nome',
                        'Não foi possível atualizar o nome do usuário, entre em contato com o suporte'
                    )
                });
                alert('Cadastro realizado com sucesso');
                //navigation.replace('Login');
                // ...
            })
            .catch((error) => {
                const errorCode = error.code;
                if (errorCode === 'auth/email-already-in-use') {
                    Alert.alert('Não foi possível cadastrar', 'Esse E-mail já foi cadastrado');
                    return;
                }
                const errorMessage = error.message;
                alert(errorMessage);
                // ..
            });


        /*const data = {
            nome: nome,
            email: email,
            senha: senha,
        }
        const response = await fetch('http://192.168.0.104:8080/newApi/cadastro',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }
        );
        const json = await response.json();
        if (json.res) {
            alert('Cadastro realizado com sucesso');
            navigation.replace('Login');
        }
        else if (json.res === 'false')
            alert('Erro ao cadastrar');
        else alert('E-mail já cadastrado');*/
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