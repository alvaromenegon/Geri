import AsyncStorage from "@react-native-async-storage/async-storage";
//Não vai mais ser utilizado

const baseUrl = 'http://192.168.0.104:8080/newApi/';

const getItens = async (url, page) => {
    const p = page ?? 1;
    try {
        const response = await fetch(url + '?p=' + p);
        const json = await response.json();
        //setData(json.res);
        //setNumberPages(json.n)
        return json.res
    } catch (error) {
        console.error(error);
    }
};


const api = async (url) => {
    const email = await AsyncStorage.getItem('email');
    if (typeof url === 'object') {
        console.log(url)
        const _url = baseUrl + url.url;
        const { method, body } = url;
        try {
            const response = await fetch(_url, {
                method: method,
                user: email,
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'user': email
                }
            });
            const json = await response.json();
            return json;
        } catch (error) {
            console.error(error);
            return { error: 'Erro ao tentar se conectar com o servidor', status: 500 }
        }
    }
    else {
        try {
            const res = await fetch(url);
            const json = await res.json();
            return json.res;
        } catch (error) {
            console.log(error);
        }
    }
}

export { getItens, api }