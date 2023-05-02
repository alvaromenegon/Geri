import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const storeData = async (page) => {
    let recent = '';
    try {
        for (let i = 1; i < 5; i++) {
            recent = await AsyncStorage.getItem(`recent${i}`);
            if (recent === page) {
                return true;
            }
            else if (recent === null) {
                await AsyncStorage.setItem(`recent${i}`, page);
                await AsyncStorage.setItem(`lastEdited`, i.toString());
                return true;
            } 
        }
        let lastEdited = await AsyncStorage.getItem(`lastEdited`);
        lastEdited = parseInt(lastEdited);
        if (lastEdited === 4) {
            lastEdited = 1;
            await AsyncStorage.setItem(`recent${lastEdited}`, page);
            await AsyncStorage.setItem('lastEdited', lastEdited.toString());
            return true;
        }
        await AsyncStorage.setItem(`recent${lastEdited + 1}`, page);
        await AsyncStorage.setItem('lastEdited', (lastEdited + 1).toString());
        return true;
    } catch (e) {
        console.error(e);
        alert('Houve um erro ao salvar os dados')
    }
}

const goTo = (page) => {
    storeData(page).then(() => {
        const navigation = useNavigation();
        navigation.navigate(page);
    });
}

export {goTo,storeData};