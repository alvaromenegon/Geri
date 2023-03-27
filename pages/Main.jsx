import { StyleSheet, Text, View } from 'react-native';
import colors from '../assets/colors.json';

export default function Main() {    
    return (
        <View style={styles.main}>
            <Text style={{
                fontSize: 40
            }}>Entrega 1</Text>           
        </View>
    )
}

const styles = StyleSheet.create({
    main: {
        flex: 1,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

