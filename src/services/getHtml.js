const getHtml = (nome, preco, descricao, validade, id) => {
    return (`
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<style>
    table,
    th,
    td {
        border: 1px solid black;
        border-collapse: collapse;
        text-align: left;
        padding: 5px;
    }

    img {
        padding-top: 20px;
        display: block;
        margin-left: auto;
        margin-right: auto;
    }
</style>

<body>

    <body>
        <table style=" margin:auto">
            <tr>
                <th>Nome</th>
                <td>${nome}</td>
            </tr>
            <tr>
                <th>Preço</th>
                <td>${preco}</td>
            </tr>
            <tr>
                <th>Descrição</th>
                <td>${descricao}</td>
            </tr>
            <tr>
                <th>Validade</th>
                <td>${validade}</td>
            </tr>
        </table>
        <img src="https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=produto/${id}">
    </body>

</html>
`)
}

export default getHtml;