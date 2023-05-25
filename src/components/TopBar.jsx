import { Modal, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import example from '../../assets/icon.png';
import colors from '../assets/colors.json';
import { useWindowDimensions } from 'react-native';
import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import style from '../assets/style.json'
import { storeData } from '../assets/utils';
//import AsyncStorage from '@react-native-async-storage/async-storage';

const TopBar = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const navigator = useNavigation();
    const history = navigator.getState().routes.length;
    const screenName = navigator.getState().routes[navigator.getState().routes.length - 1].name;

    const goTo = (page) => {
        setModalVisible(false);
        storeData(page).then(() => {
            if (history< 2)
                navigator.navigate(page);
            else {
                navigator.replace(page);
            }
        })
    }
    const height = useWindowDimensions().width;
    const styles = StyleSheet.create({
        menusuperior: {
            backgroundColor: colors.primary,
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'row',
            padding: 10,
            height: height * 0.15,
        },
        pfp: {
            width: 50,
            height: 50
        },
        menuLateral: {
            backgroundColor: colors.primaryLight,
            width: "65%",
            height: "100%",
            padding: 10
        },
        navs: {
            borderTopColor: 'black',
            borderTopWidth: 1,
            padding: 15

        }
    })



    const MenuLateral = () => {
        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <View style={{
                    backgroundColor: "#00000040",
                    flex: 1,
                    margin: 0,
                    padding: 0,
                    justifyContent: 'flex-start',
                    alignItems: 'flex-end'
                }}>
                    <View style={styles.menuLateral}>
                        <TouchableOpacity onPress={() => {
                            setModalVisible(!modalVisible);
                        }}
                            style={{ alignSelf: 'flex-end', padding: 10 }}
                        >
                            <Feather name="x" size={32} color="black" />
                        </TouchableOpacity>
                        <Text style={style.text}>Matérias-Primas</Text>
                        <View style={styles.navs}>
                            <TouchableOpacity onPress={() => {
                                goTo('Matérias-Primas');
                            }}>
                                <Text style={style.text}>Listagem</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => {
                                goTo('Cadastrar Matéria-Prima');
                            }}>
                                <Text style={style.text}>Cadastro</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={style.text}>Formulações</Text>
                        <View style={styles.navs}>
                            <TouchableOpacity onPress={() => {
                                goTo('Formulações');
                            }}>
                                <Text style={style.text}>Listagem</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => {
                                goTo('Cadastrar Formulação');
                            }}>
                                <Text style={style.text}>Cadastro</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={style.text}>Produtos</Text>
                        <View style={styles.navs}>
                            <TouchableOpacity onPress={() => {
                                goTo('Produtos');
                            }}>
                                <Text style={style.text}>Listagem</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => {
                                goTo('Cadastrar Produto');
                            }}>
                                <Text style={style.text}>Cadastro</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={style.text}>Saídas</Text>
                        <View style={styles.navs}>
                            <TouchableOpacity onPress={() => {
                                goTo('Saídas');
                            }}>
                                <Text style={style.text}>Listagem</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => {
                                goTo('Cadastrar Saída');
                            }}>
                                <Text style={style.text}>Cadastro</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={() => {
                            goTo('Faturamento');
                        }}
                            style={styles.navs}
                        >
                            <Text style={style.text}>Faturamento</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>

        );
    }

    if (screenName == 'Login') {
        return (
            <View style={{ ...styles.menusuperior, justifyContent: 'center' }}>
                <Text style={style.mainText}>
                    Controle
                </Text>
            </View>
        )
    }
    /*const [image, setImage] = useState(null); // causando RenderError
    useEffect(() => {                           //Não utilizar useEffect/useState condiocionalmente
        AsyncStorage.getItem('profile').then((value) => {
            setImage(value);
        })
    }, [modalVisible])*/

    return (<>
        <View style={styles.menusuperior}>
            {
                screenName == 'Controle' ?
                    <TouchableOpacity onPress={() => {
                        goTo('Perfil');
                    }}>
                        <Image source={/* 
                        //Fonte da foto será trocada para o Firebase Storage
                        image ? {uri:image} :*/ example} borderRadius={50} style={styles.pfp}></Image>
                    </TouchableOpacity> :
                    <TouchableOpacity onPress={() => {
                        navigator.goBack();
                    }}>
                        <Feather name="arrow-left" size={32} color="black" />
                    </TouchableOpacity>
            }{screenName != 'Cadastro' ? <>
            <Text style={style.mainText}>
                {screenName}
            </Text>
            
                <TouchableOpacity onPress={() => {
                    setModalVisible(!modalVisible);
                }}>
                    <Feather name="menu" size={32} color="black" />
                </TouchableOpacity>
                <MenuLateral /></> : null}
        </View>
    </>
    )
}

export default TopBar;