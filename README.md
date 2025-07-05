# Odysee Last Tip Widget

Display a widget in OBS of the last tip received with AR (arweave) on the live stream in Odysee. This is a static widget.

![Last Tip](https://thumbs.odycdn.com/f6bdc0165a830fa8d2c5b0d9b9adeaa1.webp)

## Last AR Tip Notification Widget for OBS

This widget displays real-time notifications when you receive tips on your Odysee live stream. Designed to integrate easily with OBS Studio.

## Prerequisites

1. Node.js v16 or higher (latest LTS version recommended).
2. npm (included with Node.js).
3. OBS Studio.

## Installation

Clone this repository or download the files. Open a terminal in the project folder. Run the following command to install the dependencies:

Use the command: **npm install**. Rename the **.env.example file to .env** in the project root and change the AR wallet address (arweave).

```
WALLET_ADDRESS=AR wallet address
PORT=3001
```

Save the changes and then run **npm start** at the terminal. The server will run the app and you can monitor it in the terminal.

## OBS Integration:

1. In OBS Studio, add a new "Source" of type "Browser" to your scene.
2. Set the URL to http://localhost:3001.
3. Adjust the size according to your needs.

And that's it, the widget is now working. You can monitor the entire process from the terminal and check for any unexpected errors.

## Main Dependencies:

1. Express: Web server
1. WebSockets: Real-time communication
1. Axios: HTTP requests
1. dotenv: Environment variable management

## Some considerations:

The widget's styles and messages are fully customizable from the project files. The widget information is automatically updated when you receive a tip.

The widget doesn't display the username or channel that sent the channel tip on Odysee. Some users may prefer this for privacy reasons.

**This is an independent project for fun; it is not an official Odysee product.**