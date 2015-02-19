# bitPepsi

<h2>bitcoinify a pepsi vending machine</h2>

<p>This application is designed to watch specific bitcoin wallet(s) for specific deposit amounts. When detected, the application will fire a specific GPIO on the Raspberry Pi which is then used to activate the vending mechanism in whatever vending machine you have it connected to.</p>

<h2>/config/bitpepsi.json</h2>
<p>This is the main configuration file, where you can specify wallets and other properties for the application.</p>

<h3>Wallets</h3>
<p>This array contains all the wallet data that the app monitors. This array is iterated over automatically; any wallet added in the correct format will be included.</p>
<ul><li>pubkey[string]: this is the public key that represents the wallet to be monitored</li>
<li>itemcost[$]: What amount should the application looking for? This is measured in CAD.</li>
<li>gpio[int]: represents the gpio pin number to be fired. I recommend you refer to the pi-gpio mapping found here: https://www.npmjs.com/package/pi-gpio</li>
<li>pricetolerance[$]: Used in conjunction with itemcost, applies a tolerance to the monitored price to account for realtime fluctuations in value. Measured in dollars, so a value of 0.03 would mean that an amount detected that was less than three cents below the itemcost would still be a valid transaction.</li></ul>

<h3>Gpio</h3>
<p>Global gpio parameters to optimize behaviour of the application.
gpiochecktime[ms]: Currently not enabled. Will implement a delay, limiting how quickly the GPIO will fire to prevent deposits spamming the vending machine. Measured in milliseconds.</p>
<ul><li>verbose[boolean]: A debugging flag. WHen true, much more gpio-related loggig will be created.</li>
<li>reconnects[ms]: Currently not enabled. Will represent the reconnect delay if internet connectivity is broken.</li></ul>

<h3>Market</h3>
<ul><li>Parameters for the bitcoinaverage.com API that is used to monitor real-time bitcoin pricing. This is set up as a global average from all monitored exchanges.</li></ul>
