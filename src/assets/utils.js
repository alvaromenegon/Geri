import { useNavigation } from '@react-navigation/native';
import { get, getDatabase, ref, update } from 'firebase/database';
import firebase from '../services/firebaseConfig';
import { getAuth } from 'firebase/auth';

const storeData = async (page) => { //Função responsável por salvar as páginas recentes no  
    //no realtime db
    try {
        var i = 1
        for (i = 1; i < 5; i++) {
            let snapshot = await get(ref(getDatabase(firebase), `data/${getAuth().currentUser.uid}/recentes/`));
            const node = snapshot.child(`${i}`).val();
            if (node == page) {
                break;
            }
            
            if (node === null) {
                update(ref(getDatabase(firebase), `data/${getAuth().currentUser.uid}/recentes/`),
                    {
                        [i]: page,
                        last: i
                    }
                );
                break;
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

    } catch (e) {
        console.error(e);
        //alert('Houve um erro ao salvar os dados')
    }
    return true;
}

const goTo = (page) => {
    storeData(page).then(() => {
        const navigation = useNavigation();
        navigation.navigate(page);
    });
}

export { goTo, storeData };