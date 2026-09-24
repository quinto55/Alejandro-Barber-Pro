# Dejar que el calendario haga espacio para los complementos

**Para Alejandro.** Son unos dos minutos por servicio, y esta vez solo son
tres servicios.

(Versión en inglés: `cal-multiple-durations.md`.)

## Por qué

La página web va a tener un paso de complementos: después de elegir un
corte, el cliente puede añadir diseño, cejas, lavado de cabello o facial.
Cada uno toma tiempo extra, y Cal.com tiene que poder reservar ese tiempo.

Cal solo deja que un evento ofrezca duraciones de su propio menú fijo, así
que la página redondea cada cita **hacia arriba** a la siguiente duración
de ese menú — nunca hacia abajo, para que nunca te queden dos citas
encimadas. Cuando hayas hecho los pasos de abajo, un corte con diseño
reserva 75 minutos, un corte con facial 75, un corte con todo 120. Un corte
solo reserva 60 en vez de 55.

Hasta que lo hagas, la página mantiene el paso de complementos escondido a
propósito: Cal ignoraría el tiempo extra y te quedaría un facial metido en
un espacio de 55 minutos.

## Haz esto, una vez por cada servicio

Los nombres de los botones van en inglés y entre paréntesis en español,
porque no sabemos en qué idioma tienes puesta tu cuenta de Cal.com. Vas a
ver uno de los dos.

1. Entra a **cal.com** e inicia sesión.
2. Abre **Event Types** (Tipos de evento) y haz clic en el primer servicio
   de la lista de abajo.
3. Quédate en la pestaña **Setup** (Configuración), la primera. Baja hasta
   **Duration** (Duración).
4. Activa **Allow multiple durations** (Permitir varias duraciones).
5. En **Available durations** (Duraciones disponibles), marca exactamente
   las duraciones que dice la tabla de abajo para ese servicio — ni una
   más, ni una menos.
6. En **Default duration** (Duración predeterminada), pon la que dice la
   tabla.
7. Marca **Hide duration selector in booking page** (Ocultar el selector de
   duración en la página de reserva). Así el cliente no puede cambiar la
   duración por su cuenta; la página web se la pone.
8. Haz clic en **Save** (Guardar), arriba a la derecha.

Después regresa a Event Types y repite con el siguiente.

## Los tres servicios

Están en inglés porque así los tienes nombrados en Cal.com.

| Servicio | Marca estas duraciones | Predeterminada |
|---|---|---|
| Haircut | 60, 75, 80, 90, 120 mins | 60 mins |
| Haircut-Beard | 80, 90, 120, 150 mins | 80 mins |
| Kids haircut, ages 6–12 | 50, 60, 75, 80, 90, 120 mins | 50 mins |

Ve marcándolos:

- [ ] Haircut
- [ ] Haircut-Beard
- [ ] Kids haircut, ages 6–12

Vas a notar dos cosas, y las dos son a propósito: la predeterminada de
Haircut pasa de 55 a 60 minutos, y la de Kids pasa de 55 a 50 (que es lo
que ya dicen tu Booksy y la página web).

## Lo que NO debes tocar

- **Platinum highlights**, **Platinum Colour and hydration** y **Sunday &
  after-hours VIP** se quedan exactamente como están. Sin varias duraciones
  en esos.
- Nada en la pestaña **Advanced** (Avanzado). El teléfono ahí por fin
  quedó bien.

## Cómo saber que quedó bien

Avísale a Anthony cuando hayas hecho los tres. `npm run check:cal` revisa
tus tres servicios en vivo y dice cuáles coinciden. Cuando coincidan los
tres, él activa el paso de complementos en la página.
