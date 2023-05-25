import Lists from '../components/Lists';
import { storeData} from '../assets/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const Listagens = () => {
    //Remover
    //não é utilizado
    const [uid, setUid] = useState('');
    useEffect(() => {
        AsyncStorage.getItem('user').then((user) => {
            setUid(JSON.parse(user).uid);
        })
    }, [])

    return (
        <Lists format="erro" url={"mp"} uid={uid} />
    )
}

const MateriasPrimas = () => {
    return (
        <Lists format="mp" url={"mps"} />
    )
}

//Renderiza as listagens passando o formato e a url para o componente Lists

const Formulacoes = () => {
    return (
        <Lists format="form" url={"forms"} />
    )
}

const Produtos = () => {
    return (
        <Lists format="prod" url={"produtos"} />
    )
}

const Saidas = () => {
    console.warn('Falta corrigir')
    return (
        <Lists format="saida" url={"saidas"} />
    )
}

export { Listagens, MateriasPrimas, Formulacoes, Produtos, Saidas, storeData };