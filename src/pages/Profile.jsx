import { Image, View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert } from "react-native";
import style from '../assets/style.json';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { StackActions, useNavigation } from "@react-navigation/native";
import { InputWithLabel } from "../components/InputWithLabel";
import { api } from "../services/api";
import * as ImagePicker from 'expo-image-picker';
import {getAuth} from 'firebase/auth';
 


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
            const login = JSON.parse(user).login;
            const email = JSON.parse(user).email;
            if (login !== null && email !== null) {
                setUsername(login);
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

        const alterarEmail = async (newemail, senha) => {
            var status = 0;
            try {
                api({
                    method: 'post',
                    url: 'alterarEmail',
                    data: {
                        email: newemail,
                        senha: senha,
                    }
                }).then((response) => {
                    console.log(response);
                    status = response.status;
                }).catch((error) => {
                    console.error(error);
                })
            } catch (error) {
                console.error(error);
            } finally {
                if (status === 200) {
                    Alert.alert('Sucesso', 'E-mail alterado com sucesso');
                    setEmail(newemail);
                    setIsLoading(false);
                    setModalVisible(false);
                }
                else {
                    setIsLoading(false);
                    Alert.alert('Erro', 'Erro ao alterar e-mail');
                }
                setIsLoading(false);
            }


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
                                            <InputWithLabel label="Confirme a senha" value={confirmarSenha} secure={true} onChangeText={text => setConfirmarSenha(text)} />
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

    const pickImage = async () => {
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
            }
            )
        }
    };

    const sair = () => {
        const auth = getAuth();
        signOut(auth).then(() => {
            AsyncStorage.removeItem('user').then(() => {
                navigation.navigate('Login');
            })
        }).catch((error) => {
            console.error(error);
        }
        )
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
                    <Image source={image ? { uri: image } : require('../../assets/icon.png')}
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
                        onPress={() => { pickImage() }}
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
                onPress={async () => {
                    await AsyncStorage.removeItem('user');
                    await AsyncStorage.setItem('prevUser',
                        JSON.stringify({
                            login: username,
                            email: email,
                        })
                    );
                    navigation.dispatch(StackActions.popToTop())
                    navigation.replace('Login');
                }}
            >
                <Text>Sair</Text>
            </TouchableOpacity>
            <Alterar />
        </View>
    )
}

export default Profile;