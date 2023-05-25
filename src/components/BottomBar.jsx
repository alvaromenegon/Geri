import { TouchableOpacity, View } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { storeData } from '../assets/utils';

const BottomBar = function () {
    const navigation = useNavigation();
    const history = navigation.getState().routes.length
    const goTo = (page) => {
        if (history < 2) {
            storeData(page).then(() => {
                navigation.navigate(page)
            })
        }
        else {
            storeData(page).then(() => {
                navigation.replace(page);
            })
        }
    }
    return (
        <View style={styles.bottomBar}>
            <TouchableOpacity
                onPress={() => { goTo('Matérias-Primas') }}
                style={styles.iconButton}
            >
                <Entypo name="leaf" size={26} color="black" />
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => { goTo('Formulações') }}
                style={styles.iconButton}
            >
                <Entypo name="clipboard" size={26} color="black" />
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => { goTo('Produtos') }}
                style={styles.iconButton}
            >
                <Entypo name="shop" size={26} color="black" />
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => { goTo('Saídas') }}
                style={styles.iconButton}
            >
                <Entypo name="credit" size={26} color="black" />
            </TouchableOpacity>

        </View>
    )
}

const styles = StyleSheet.create({
    bottomBar: {
        height: 60,
        backgroundColor: '#d9d9d9c0',
        justifyContent: 'space-around',
        alignItems: 'center',
        flexDirection: 'row',
        position: 'absolute',
        bottom: 0,
        width: '100%',    
    }
});

export default BottomBar;