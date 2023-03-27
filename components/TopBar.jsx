import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import example from '../assets/icon.png';
import colors from '../assets/colors.json';


const TopBar = () => {
    return (
        <View style={styles.menusuperior}>
            <TouchableOpacity onPress={() => { alert('Não implementado') }}>
                <Image source={example} borderRadius={50} style={styles.pfp}></Image>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { alert('Não implementado') }}>
                <Feather name="menu" size={32} color="black" />
            </TouchableOpacity>

        </View>
    )
}
const styles = StyleSheet.create({
    menusuperior: {
        backgroundColor: colors.primary,
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
        padding: 10,
        //height: height
    },
    pfp: {
        width: 50,
        height: 50
    },
})

export default TopBar;