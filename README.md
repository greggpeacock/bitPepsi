# bitPepsi

<h2>bitcoinify a pepsi vending machine</h2>

<p>This application is designed to watch specific bitcoin wallet(s) for specific deposit amounts. When detected, the application will fire a specific GPIO on the Raspberry Pi which is then used to activate the vending mechanism in whatever vending machine you have it connected to.</p>

<h2>INSTALLING</h2>
<p>Buckle up this is going to be bumpy.</p>
<ul><li>Download the latest image of debian linux for the Raspberry Pi (Raspian).</li>
<li>Install node.</li>
<li>Realise that node is some kind of ancient radio-related package, uninstall node.</li>
<li>Install nodejs.</li>
<li>Try to run the program (It's worth a shot).</li>
<li>Read error message regarding the absence of the 'btc-stats' module</li>
<li>Install npm.</li>
<li>Execute npm install btc-stats.</li>
<li>Frown at strange error output from npm regarding http get instructions.</li>
<li>Google the error.</li>
<li>Shake your head upon realising that the debian npm package is so out of date the SSL certs have expired.</li>
<li>Hold your nose and curl an online npm install script straight into a root shell.</li>
<li>Sigh upon seeing the error message 'Your node installation is too old and unsupported'.</li>
<li>Try the same update method with node itself this time.</li>
<li>Get exited when the script exits cleanly after 10 minutes.</li>
<li>Get npm updated via curl again; we're on a roll now.</li>
<li>Do a quick 'npm --version' check.</li>
<li>Curse loudly upon seeing 'Node Error: Illegal Hardware Instruction'. Now knowing this strategy will never work on an ARMv6 raspberry pi.</li>
<li>Find the original, ancient node version in the cached packages. Install via 'dpkg -i'</li>
<li>Finally get btc-stats installed. Run the program again, somewhat numb to any possible success.</li>
<li>Turn that frown upside-down, we're up and listening for transactions!.</li>
<li>Spend some bitcoin to see if it works. Testnet is for losers anyway.</li>
<li>Ponder error regarding gpio pins.</li>
<li>Feel better that it's all the fault of upstream maintainers upon reading open github issues on changed gpio device node locations.</li>
<li>Resign to the fact that your only solution for now is to downgrade Debian even further.</li>
<p>To be continued...</p>


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
