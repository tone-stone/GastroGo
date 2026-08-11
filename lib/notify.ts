import { Alert, Platform } from 'react-native';

export function showKitchenReadyAlert(tableName: string, itemName: string, quantity: number) {
  const qtyLabel = quantity > 1 ? `${quantity}× ` : '';
  const message = `${qtyLabel}${itemName} listo para servir en ${tableName}.`;

  if (Platform.OS === 'web') {
    window.alert(`¡Platillo listo!\n\n${message}\n\nEl mesero verá la actualización en su comanda.`);
    return;
  }

  Alert.alert('¡Platillo listo!', message, [{ text: 'OK' }]);
}
