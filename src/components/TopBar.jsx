import { Modal, Image, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import example from '../../assets/profile.png';
import logo from '../../assets/geri.png';
import colors from '../assets/colors.json';
import { useWindowDimensions } from 'react-native';
import { useState } from 'react';
import { StackActions, useNavigation } from '@react-navigation/native';
import style from '../assets/style.json'
import { storeData } from '../assets/utils';

const TopBar = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const navigator = useNavigation();
    const history = navigator.getState().routes.length;
    const screenName = navigator.getState().routes[navigator.getState().routes.length - 1].name;

    const goTo = (page) => {
        setModalVisible(false);
        storeData(page).then(() => {
            if (history < 2)
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
            width: 35,
            height: 35,
            borderWidth: 1,
        },
        menuLateral: {
            backgroundColor: colors.primaryLight,
            width: "65%",
            height: "100%",
            padding: 10
        },
        navs: {
            padding: 15
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            borderBottomColor: colors.primary,
            borderBottomWidth: 2,
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
                }}>
                <View style={{
                    backgroundColor: "#00000040",
                    flex: 1,
                    margin: 0,
                    padding: 0,
                    justifyContent: 'flex-start',
                    alignItems: 'flex-end',

                }}>
                    <TouchableOpacity onPress={() => {
                        setModalVisible(!modalVisible);
                    }} //Botão invisível para fechar o modal quando clicado fora do menu
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    >
                    </TouchableOpacity>

                    <View style={styles.menuLateral}>
                        {screenName != 'Geri' ?
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomColor: style.colors.primary, borderBottomWidth:2, marginBottom:10 }}>
                                <TouchableOpacity onPress={() => {
                                    navigator.dispatch(StackActions.popToTop());
                                    navigator.replace('Geri');
                                    setModalVisible(!modalVisible);
                                }}
                                    style={{ padding: 10 }}
                                >
                                    <Feather name="home" size={32} color="black" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => {
                                    setModalVisible(!modalVisible);
                                }}
                                    style={{ padding: 10 }}
                                >
                                    <Feather name="x" size={32} color="black" />
                                </TouchableOpacity>
                            </View> :
                            <TouchableOpacity onPress={() => {
                                setModalVisible(!modalVisible);
                            }}
                                style={{ alignSelf: 'flex-end', padding: 10 }}
                            >
                                <Feather name="x" size={32} color="black" />
                            </TouchableOpacity>}
                        <ScrollView>
                            <Text style={styles.title}>Matérias-Primas</Text>
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
                            <Text style={styles.title}>Formulações</Text>
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
                            <Text style={styles.title}>Produtos</Text>
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
                            <Text style={styles.title}>Saídas</Text>
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
                            <Text style={styles.title}>Outros</Text>
                            <View style={styles.navs}>
                                <TouchableOpacity onPress={() => {
                                    goTo('Faturamento');
                                }}
                                >
                                    <Text style={style.text}>Faturamento</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => {
                                    goTo('Calculadora');
                                }}
                                >
                                    <Text style={style.text}>Calculadora de Custo</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                </View>
            </View>
            </Modal >
        );
    }

if (screenName == 'Login') {
    return (
        <View style={{ ...styles.menusuperior, justifyContent: 'center' }}>
            <Image source={logo} resizeMode='contain' style={{ width: '20%', height: '80%' }} />
        </View>
    )
}

return (<>
    <View style={styles.menusuperior}>
        {
            screenName == 'Geri' ?
                <TouchableOpacity onPress={() => {
                    goTo('Perfil');
                }}>
                    <Image source={example} style={styles.pfp}></Image>
                </TouchableOpacity> :
                <TouchableOpacity onPress={() => {
                    navigator.goBack();
                }}>
                    <Feather name="arrow-left" size={32} color="black" />
                </TouchableOpacity>
        }
        {screenName != 'Cadastro' ? <>
            {screenName == 'Geri' ? <Image source={logo} resizeMode='contain' style={{ width: '20%', height: '80%' }} /> :
                <Text style={style.mainText}>
                    {screenName}
                </Text>}

            {screenName !== 'Ler QR Code' ? <TouchableOpacity onPress={() => {
                setModalVisible(!modalVisible);
            }}>
                <Feather name="menu" size={32} color="black" />
            </TouchableOpacity> :
                <View style={{ width: 32 }}></View>}
            <MenuLateral /></> : null}
    </View>
</>
)
}

export default TopBar;