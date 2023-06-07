import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { get, getDatabase, ref, set, update } from 'firebase/database';
import firebase from '../services/firebaseConfig';
import { getAuth } from 'firebase/auth';

const storeData = async (page) => { //Função responsável por salvar as páginas recentes no AsyncStorage 
    let recent = '';                //será alterado para que salve os dados de forma mais eficiente
    //no realtime db

    try {
        var i = 1
        for (i = 1; i < 5; i++) {
            let snapshot = await get(ref(getDatabase(firebase), `data/${getAuth().currentUser.uid}/recentes/`));
            const node = snapshot.child(`${i}`).val();
            if (node === page) {
                return true;
            }
            
            if (node === null) {
                update(ref(getDatabase(firebase), `data/${getAuth().currentUser.uid}/recentes/`),
                    {
                        [i]: page,
                        last: i
                    }
                );
                return true;
            }
            const last = snapshot.child('last').val();
            if (i + 1 === 5) {
                if (last === 4) {
                    i=1;
                    const data =  {[i]: page,last: 1};
                    update(ref(getDatabase(firebase), `data/${getAuth().currentUser.uid}/recentes/`),data);
                    return true;
                }
                i = last+1;
                update(ref(getDatabase(firebase), `data/${getAuth().currentUser.uid}/recentes/`),
                    {
                        [i]: page,
                        last: i
                    }
                );
                return true;
            }
        }


        recent = await AsyncStorage.getItem(`recent${i}`);
        if (recent === page) {
            return true;
        }
        else if (recent === null) {
            await AsyncStorage.setItem(`recent${i}`, page);
            await AsyncStorage.setItem(`lastEdited`, i.toString());
            return true;
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

export { goTo, storeData };