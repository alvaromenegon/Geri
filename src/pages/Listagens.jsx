import Lists from '../components/Lists';
import { storeData} from '../assets/utils';

//const basicUrl = 'https://controle-produtos.up.railway.app/newApi/';
const basicUrl = 'http://192.168.0.104:8080/newApi/';


const Listagens = () => {
    return (
        <Lists format="erro" url={basicUrl + "mp"} />
    )
}

const MateriasPrimas = () => {
    return (
        <Lists format="mp" url={basicUrl + "mps"} />
    )

}

const Formulacoes = () => {
    return (
        <Lists format="form" url={basicUrl + "forms"} />
    )
}

const Produtos = () => {
    return (
        <Lists format="prod" url={basicUrl + "produtos"} />
    )
}

const Saidas = () => {
    return (
        <Lists format="saida" url={basicUrl + "saidas"} />
    )
}

export { Listagens, MateriasPrimas, Formulacoes, Produtos, Saidas, storeData };