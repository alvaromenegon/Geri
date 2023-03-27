import { TouchableOpacity, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';

const BottomBar = function () {
    return (
        <View style={{
            height: 60,
            backgroundColor: '#d9d9d940',
            justifyContent: 'space-around',
            alignItems: 'center',
            flexDirection: 'row',
            padding: 10,
        }}>
            <TouchableOpacity onPress={() => { alert('Não implementado') }}>
                <AntDesign name="home" size={26} color="black" />
            </TouchableOpacity><TouchableOpacity onPress={() => { alert('Não implementado') }}>
                <AntDesign name="home" size={26} color="black" />
            </TouchableOpacity><TouchableOpacity onPress={() => { alert('Não implementado') }}>
                <AntDesign name="home" size={26} color="black" />
            </TouchableOpacity><TouchableOpacity onPress={() => { alert('Não implementado') }}>
                <AntDesign name="home" size={26} color="black" />
            </TouchableOpacity>
        </View>
    )
}

export default BottomBar;