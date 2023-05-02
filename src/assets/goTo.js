import { useNavigation } from "@react-navigation/native";


export default function goTo(page) {
    const storeData = async (page) => {
        console.log('Storing data...', page)
        let recent = '';
        try {
            for (let i = 1; i < 5; i++) {
                recent = await AsyncStorage.getItem(`recent${i}`);
                if (recent === null) {
                    await AsyncStorage.setItem(`recent${i}`, page);
                    await AsyncStorage.setItem(`lastEdited`, i.toString());
                    return true;
                }
                else if (recent === page) {
                    return true;
                }
            }
            let lastEdited = await AsyncStorage.getItem(`lastEdited`);
            lastEdited = parseInt(lastEdited);
            if (lastEdited === 4) {
                lastEdited = 1;
            }
            await AsyncStorage.setItem(`recent${i+1}`, page);
            await AsyncStorage.setItem(`lastEdited`, (i+1).toString());
            return true;
        } catch (e) {
            alert('Houve um erro ao salvar os dados')
        }
    }

    storeData(page);

    const navigation = useNavigation();
    navigation.navigate(page);
    return true;
}