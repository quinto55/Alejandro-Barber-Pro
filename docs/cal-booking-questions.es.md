# Activar el número de teléfono en las reservas

**Para Alejandro.** Son unos cinco minutos. Hay que hacerlo seis veces —
una por cada servicio — porque Cal.com guarda el formulario de reserva por
separado en cada uno.

(Versión en inglés: `cal-booking-questions.md`.)

## Por qué

Ahora mismo el formulario solo pide el nombre y el correo. Si un cliente
necesita mover o cancelar una cita el mismo día, o si tú vas retrasado y
necesitas avisarle, no tienes un número al cual llamar. Después de este
cambio, cada reserva te llega con un teléfono.

## Haz esto, una vez por cada servicio

Los nombres de los botones van en inglés y entre paréntesis en español,
porque no sabemos en qué idioma tienes puesta tu cuenta de Cal.com. Vas a
ver uno de los dos.

1. Entra a **cal.com** e inicia sesión.
2. Abre **Event Types** (Tipos de evento) y haz clic en el primer servicio
   de la lista de abajo.
3. Haz clic en la pestaña **Advanced** (Avanzado), arriba, al lado de
   Setup, Availability y Limits.
4. Baja hasta la sección **Booking questions** (Preguntas de reserva). Ahí
   está la lista de los campos que llena el cliente: Your name, Email
   Address, Phone Number, Additional notes, y demás.
5. Busca la fila de **Phone Number** (Número de teléfono). Son dos cambios
   en esa misma fila:
   - Activa el **interruptor de la derecha**, para que el campo se muestre
     en vez de quedar oculto.
   - Haz clic en **Edit** (Editar), pon **Required** (Obligatorio) en
     **Yes** (Sí), y guarda la fila.
6. Haz clic en **Save** (Guardar), arriba a la derecha.

Después regresa a Event Types y repite con el siguiente.

## Los seis servicios

Ve marcándolos — de eso se trata, que no quede ninguno por fuera. Están en
inglés porque así los tienes nombrados en Cal.com:

- [ ] Haircut
- [ ] Haircut-Beard
- [ ] Kids haircut, ages 6–12
- [ ] Platinum highlights
- [ ] Platinum Colour and hydration
- [ ] Sunday & after-hours VIP

## Una cosa que NO debes tocar

Arriba de **Booking questions** hay una opción de **Confirmation**
(Confirmación) con un interruptor entre **Email** y **Phone**. Déjalo en
**Email**.

Ese interruptor hace algo distinto a lo que queremos: *reemplaza* el correo
por el teléfono como único dato que pides. Nosotros queremos los dos — el
correo es lo que le manda al cliente su confirmación y su recordatorio. Si
lo cambias, dejan de enviarse. Modifica solamente la fila de **Phone
Number**, que está más abajo en esa misma lista.

## Cómo saber que quedó bien

Avísale a Anthony cuando hayas hecho los seis y él lo verifica de su lado
(`npm run check:cal` revisa las seis páginas de reserva y dice cuáles
quedaron bien). También puedes abrirlo tú mismo: entra a
https://alejandrobarberpro.com, elige un servicio y mira el formulario —
la casilla del teléfono debe aparecer, con un asterisco rojo al lado.
