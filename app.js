const httpserver = require("http");
const express = require("express");
const path = require("path");
const app = express();
const server = httpserver.createServer(app);
const socketIO = require("socket.io");
const io = socketIO(server);
let waiting_players=[];
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';

function checkWin() {
    const winConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8], 
        [0, 4, 8], [2, 4, 6]             
    ];

    for (let condition of winConditions) {
        const [a, b, c] = condition;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }

    if (board.every(cell => cell !== '')) {
        return 'draw'; 
    }

    return null; 
}

io.on("connection",(socket)=>{
    console.log("A user connected successfully!! ")
    socket.on('initial_state',()=>{
        board = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X';
    })
    socket.on("find opponent",()=>{
        if(waiting_players.length>0){
            const oppon = waiting_players.shift();
            socket.opponent = oppon;
            oppon.opponent = socket;
            socket.symbol = 'X';
            oppon.symbol = 'O';
            socket.emit("opp_found",{ symbol: socket.symbol });
            oppon.emit("opp_found",{ symbol: oppon.symbol });
            socket.emit("currplyr", currentPlayer);
            oppon.emit("currplyr", currentPlayer);
        }
        else{
            waiting_players.push(socket);
        }
        
    socket.on('move',(data)=>{
        const{index,turn_of}=data;
        console.log(index);
        console.log("hi");
        console.log(board[index]);
        console.log(currentPlayer);
        console.log(socket.symbol);
        
        if (board[index] === '' && currentPlayer === turn_of) {

            console.log("hello");
            board[index] = currentPlayer;
            io.emit('update', { index, symbol: currentPlayer });
            
            const winner = checkWin();
            console.log(winner);
            if (winner) {
                io.emit('game_over',  winner );
            } else {
                currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
                console.log(currentPlayer);
                io.emit("currplyr",currentPlayer);
            }
        }
    });


     
        socket.on('disconnect',()=>{
            console.log("user disconnected!! ");
            waiting_players = waiting_players.filter(player=>player!==socket);
            console.log(socket.opponent);
            if (socket.opponent) {
              //  console.log("discnnnnnnn");
                socket.opponent.emit("discn");
            }
            board = ['', '', '', '', '', '', '', '', ''];
            currentPlayer = 'X';
         //   console.log("huhu");
            
        })

    })
})



































app.use(express.static(path.resolve(__dirname,"public")))
app.get('/',(req,res)=>{
    res.sendFile("/public/index.html",(err)=>{
        console.log(err);
    })
})



server.listen(3000,()=>{
    console.log("server activated !! ")
})
