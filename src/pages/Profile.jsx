import { Image, View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert } from "react-native";
import style from '../assets/style.json';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { StackActions, useNavigation } from "@react-navigation/native";
import { InputWithLabel } from "../components/InputWithLabel";
import * as ImagePicker from 'expo-image-picker';
import { getAuth, signOut } from 'firebase/auth';
import { getDatabase, ref, get } from 'firebase/database';
import { updateEmail, signInWithEmailAndPassword } from "firebase/auth";



const Profile = () => {
    const navigation = useNavigation();
    const [image, setImage] = useState(null);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState(0);

    const getUser = async () => {
        try {
            const user = await AsyncStorage.getItem('user');
            const nome = JSON.parse(user).nome;
            const email = JSON.parse(user).email;
            if (nome !== null && email !== null) {
                setUsername(nome);
                setEmail(email)
            }
            else {
                console.error('Houve um erro ao obter os dados do usuário');
            }
        } catch (error) {
            console.error(error);
        }
    }

    function openModal(mode) {
        setModalMode(mode);
        setModalVisible(true);
    }

    const Alterar = () => {
        const [newEmail, setNewEmail] = useState('');
        const [newSenha, setNewSenha] = useState('');
        const [confirmarSenha, setConfirmarSenha] = useState('');
        const [isLoading, setIsLoading] = useState(false);

        const alterarEmail = (newemail, password) => {
            setIsLoading(true);
            updateEmail(getAuth().currentUser, newemail).then(() => {
                Alert.alert('Verifique seu e-mail', 'Um e-mail de verificação foi enviado para o novo endereço de e-mail. Por favor, verifique sua caixa de entrada e clique no link para confirmar a alteração.')
                // Update successful.
            }).catch((error) => {
                console.error(error);
                if (error.code === 'auth/requires-recent-login') {
                    setIsLoading(true);
                    signInWithEmailAndPassword(getAuth(), email, password).then(() => {
                        updateEmail(getAuth().currentUser, newemail).then(() => {
                            Alert.alert('Verifique seu e-mail', 'Um e-mail de verificação foi enviado para o novo endereço de e-mail. Por favor, verifique sua caixa de entrada e clique no link para confirmar a alteração.')
                            // Update successful.
                        }).catch((error) => {
                            console.error(error);
                        });
                    }).catch((error) => {
                        console.error(error);
                        Alert.alert('Erro', 'Senha incorreta');
                    });
                }
                else if (error.code === 'auth/email-already-in-use') {
                    Alert.alert('Erro', 'O e-mail informado já está em uso');
                }
                else if (error.code === 'auth/invalid-email') {
                    Alert.alert('Erro', 'O e-mail informado é inválido');
                }
                else if (error.code === 'auth/invalid-password') {
                    Alert.alert('Erro', 'A senha informada é inválida');
                }
                else if (error.code === 'auth/user-token-expired') {
                    Alert.prompt('Erro', 'Por favor, faça login novamente para continuar',
                        [
                            {
                                text: 'OK',
                                onPress: () => {
                                    signOut(getAuth()).then(() => {
                                        AsyncStorage.removeItem('user');
                                        navigation.dispatch(StackActions.replace('Login'));
                                    }).catch((error) => {
                                        console.error(error);
                                    });
                                },
                            }, {
                                text: 'Cancelar', style: 'cancel', onPress: () => { }
                            }
                        ],);
                }
                else {
                    Alert.alert('Erro', 'Ocorreu um erro ao alterar o e-mail');

                }
            });

            setIsLoading(false);
        }
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <View style={style.modalShade}>
                    <View style={{
                        ...style.modal, backgroundColor: style.colors.primaryBackground,
                        height: 300,
                        width: '80%',
                    }}>
                        {isLoading ? <><ActivityIndicator size={24} color={style.colors.secondary} />
                            <Text style={{ color: style.colors.secondary }}>Verificando dados...</Text>
                        </> :
                            <>
                                {modalMode === 'email' ?
                                    <>
                                        <View style={style.modalHeader}>
                                            <Text style={style.mainText}>Alterar E-mail</Text>
                                        </View>
                                        <View style={{
                                            flexDirection: 'column',
                                            justifyContent: 'flex-start',
                                            flex: 1
                                        }}>
                                            <InputWithLabel label="E-mail" value={newEmail} type='email-address' onChangeText={text => setNewEmail(text)} />
                                            <InputWithLabel label="Senha" value={confirmarSenha} secure={true} onChangeText={text => setConfirmarSenha(text)} />
                                        </View>
                                    </> :
                                    <>
                                        <View style={style.modalHeader}>
                                            <Text style={style.mainText}>Alterar Senha</Text>
                                        </View>
                                        <View style={{
                                            flexDirection: 'column',
                                            justifyContent: 'flex-start',
                                            flex: 1
                                        }}>
                                            <InputWithLabel label="Nova Senha" value={newSenha} secure={true} onChangeText={text => setNewSenha(text)} />
                                            <InputWithLabel label="Confirme a senha" value={confirmarSenha} secure={true} onChangeText={text => setConfirmarSenha(text)} />
                                        </View>
                                    </>
                                }

                                <View style={style.rowSpaceBetween}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setIsLoading(true);

                                            if (modalMode === 'senha') {
                                                ///implementar
                                                if (newSenha === '' || confirmarSenha === '') {
                                                    Alert.alert('Erro', 'Preencha todos os campos');
                                                }
                                                setIsLoading(false);
                                                return;
                                            }
                                            if (newEmail === email) {
                                                Alert.alert('Erro', 'O novo e-mail deve ser diferente do atual');
                                                setIsLoading(false);
                                                return;
                                            }
                                            if (newEmail.indexOf('@') === -1 || newEmail.indexOf('.') === -1) {
                                                Alert.alert('Erro', 'E-mail inválido');
                                                setIsLoading(false);
                                                return;
                                            }
                                            if (newEmail === '' || confirmarSenha === '') {
                                                Alert.alert('Erro', 'Preencha todos os campos');
                                                setIsLoading(false);
                                                return;
                                            }
                                            alterarEmail(newEmail, confirmarSenha);
                                            setConfirmarSenha('');
                                        }}
                                        style={{ ...style.button, width: 100 }}
                                    >

                                        <Text>Alterar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => { setModalVisible(false) }}
                                        style={{ ...style.button, width: 100 }}
                                    >

                                        <Text>Cancelar</Text>
                                    </TouchableOpacity>
                                </View>

                            </>}
                    </View>
                </View>
            </Modal>)
    }

    useEffect(() => {
        AsyncStorage.getItem('profile').then((value) => {
            setImage(value);
        }).then(() => {
            getUser();
        })
    }, [])

    /*const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1]
        });
        if (!result.canceled) {
            setImage(result.assets[0].uri);
            AsyncStorage.setItem('profile', image).then(() => {
                Alert.alert('Imagem Alterada', 'Imagem alterada com sucesso');
            }).catch((error) => {
                console.error(error);
            })
        }
    };*/

    const sair = () => {
        const auth = getAuth();
        signOut(auth).then(() => { //Desloga o usuário, remove seus dados e salva o e-mail para facilitar a próxima entrada
            AsyncStorage.setItem('prevUser', email).then(() => {
                AsyncStorage.removeItem('user').then(() => {
                    navigation.dispatch(StackActions.popToTop())
                    navigation.navigate('Login');
                })
            })
        })
            .catch((error) => {
                console.error(error);
            })
    }

    return (
        <View style={style.container}>
            <View style={{ ...style.rowSpaceBetween, alignItems: 'flex-start' }}>
                <View
                    style={{
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 100,
                    }}
                >
                    <Image source={require('../../assets/icon.png')}
                        borderRadius={50}
                        style={
                            {
                                width: 100,
                                height: 100,
                                marginBottom: 10,
                            }
                        }
                    ></Image>
                    <TouchableOpacity
                        //Implementar o firebase storage para salvar a imagem
                        onPress={() => {alert('Não implementado') }} 
                        style={{ ...style.button, maxWidth: 100, width: 100 }}
                    >
                        <Text style={{ color: '#fff' }}>Alterar</Text>
                    </TouchableOpacity>

                </View>
                <Text numberOfLines={3} style={{
                    ...style.text,
                    width: '55%',
                    textAlign: 'left',
                }}>
                    {username}
                </Text>
            </View>

            <View>
                <Text style={style.text}>E-mail:</Text>
                <Text style={{ fontSize: 20 }}>{email}</Text>
                <View style={{ marginTop: 20, marginBottom: 20 }}>
                    <TouchableOpacity
                        onPress={() => { openModal('email') }}
                        style={{ marginBottom: 10 }}
                    >
                        <Text style={style.text}>Alterar E-mail</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => { openModal('senha') }}
                    >
                        <Text style={style.text}>Alterar Senha</Text>
                    </TouchableOpacity>
                </View>

            </View>
            <TouchableOpacity style={{
                ...style.button,
                backgroundColor: 'red',
                width: 100,
                alignSelf: 'center',
                marginTop: 20,
            }}
                onPress={() => sair()}    >
                <Text>Sair</Text>
            </TouchableOpacity>
            <Alterar />
        </View>
    )
}

export default Profile;