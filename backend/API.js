const getItens = async () => {
    try {
        const response = await fetch(props.url);
        const json = await response.json();
        setData(json);
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
};

export default getItens;