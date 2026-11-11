import { describe, expect, it } from 'vitest';
import { activityWeight, decayedWeight, diverseOrder, tasteKey, tasteScore } from './tastes';
describe('personalización', () => {
  it('favorita y nota alta pesan más que consumir', () => expect(activityWeight({favorite:true,score:9})).toBeGreaterThan(activityWeight({consumed:true})));
  it('el descarte resta', () => expect(activityWeight({dismissed:true})).toBe(-6));
  it('lo reciente pesa más y decae', () => expect(decayedWeight(8,90)).toBe(4));
  it('reserva un 20% para explorar', () => { const result=diverseOrder(Array.from({length:20},(_,i)=>({id:String(i),score:20-i})),10); expect(result.slice(8).map(r=>r.id)).toEqual(['19','18']); });
  it('pausar deja de ajustar recomendaciones', () => expect(tasteScore(['jazz'],[{label:'Jazz',weight:10,suppressed:false}],true)).toBe(0));
  it('eliminar un gusto evita su uso', () => expect(tasteScore(['jazz'],[{label:'Jazz',weight:10,suppressed:true}])).toBe(0));
  it('la respuesta negativa baja obras similares', () => expect(tasteScore(['jazz'],[{label:'Jazz',weight:-6,suppressed:false}])).toBe(-6));
  it('normaliza IDs para no repetir vistas', () => expect(tasteKey('tmdb','movie-763')).toBe(tasteKey('tmdb','movie:763')));
});