/* ================= 基準解析度（用來做比例換算） ================= */
const BASE_W = 1920;
const BASE_H = 1080;

/* ================= 工具 ================= */
function sx(x){ return x * width / BASE_W; }
function sy(y){ return y * height / BASE_H; }

/* ================= 開始畫面 ================= */
let showIntro = true;

/* ================= 角色 / 動畫 ================= */
let spriteSheet1, spriteSheet2, spriteSheet3, bgm;
let frame1=0, frame2=0, frame3=0;
let animCounter1=0, animCounter2=0, animCounter3=0; 

const frameCount1=7, frameW1=268/7, frameH1=87;
const frameCount2=7, frameW2=268/7, frameH2=87;
const frameCount3=20, frameW3=1155/20, frameH3=63;  

let playerIdle, playerUp, playerDown, playerLeft, playerRight;
let playerX=960, playerY=760, playerFrame=0, playerAnimCounter=0; 
let playerState="idle";

let fairySheet;
let fairyFrame=0, fairyCounter=0;
const fairyFrameCount=4, fairyFrameW=140/5, fairyFrameH=43;

let bgmStarted=false;

/* ================= 問題系統 ================= */
let rawQuestions=[], questions=[];
let gameState="free";
let activeAsker=-1;
let activeQuestion=null;

/* 漫畫對話框 */
let dialogText="";
let dialogTimer=0;

/* 每位提問者 2 題 */
const askers=[
  { start:0, answered:0, done:false },
  { start:2, answered:0, done:false },
  { start:4, answered:0, done:false }
];

/* ================= preload ================= */
function preload(){
  spriteSheet1=loadImage("picture/Questioner 1.png");
  spriteSheet2=loadImage("picture/Questioner 2.png");
  spriteSheet3=loadImage("picture/Questioner 3.png");

  playerIdle=loadImage("picture/Players/idle.png");
  playerUp=loadImage("picture/Players/up.png");
  playerDown=loadImage("picture/Players/down.png");
  playerLeft=loadImage("picture/Players/lift.png");
  playerRight=loadImage("picture/Players/right.png");

  fairySheet=loadImage("picture/Little Elf.png");
  bgm=loadSound("picture/BGM.mp3");

  rawQuestions=loadStrings("question.csv");
}

/* ================= setup ================= */
function setup(){
  createCanvas(windowWidth, windowHeight);
  parseQuestions();
  textFont("sans-serif");
}

/* ================= resize ================= */
function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}

/* ================= draw ================= */
function draw(){
  clear();

  drawAsker1();
  drawAsker2();
  drawAsker3();
  drawPlayer();
  drawFairy();
  drawInteractionHint();

  if(gameState==="question" && activeQuestion && getNearestAsker()===activeAsker){
    drawQuestionPanel();
  }else if(gameState==="question"){
    gameState="free";
    activeQuestion=null;
  }

  drawDialogBox();

  if(showIntro) drawIntro();
}

/* ================= 開始畫面 ================= */
function drawIntro(){
  fill(0,180);
  rect(0,0,width,height);

  fill(255);
  textAlign(CENTER,CENTER);
  textSize(sy(36));
  text(
`遊戲規則
1.方向鍵移動角色
2.可點擊"E"進行角色互動
3.鍵盤左上"1"、"2"、"3"可進行答題(並非右側數字鍵)
4.疑惑時請點擊身旁小精靈尋求支援

按下任意鍵(關機鍵外)繼續遊戲`,
  width/2,height/2
  );
}

/* ================= 提問者 ================= */
function drawAsker1(){
  let x=sx(1630), y=sy(420);
  animCounter1++; if(animCounter1%10===0) frame1=(frame1+1)%frameCount1;
  image(spriteSheet1,x,y, sx(frameW1*3), sy(frameH1*3),
    frame1*frameW1,0,frameW1,frameH1);
}
function drawAsker2(){
  let x=sx(40), y=sy(420);
  animCounter2++; if(animCounter2%10===0) frame2=(frame2+1)%frameCount2;
  image(spriteSheet2,x,y, sx(frameW2*3), sy(frameH2*3),
    frame2*frameW2,0,frameW2,frameH2);
}
function drawAsker3(){
  let x=sx(830), y=sy(40);
  animCounter3++; if(animCounter3%6===0) frame3=(frame3+1)%frameCount3;
  image(spriteSheet3,x,y, sx(frameW3*3), sy(frameH3*3.5),
    frame3*frameW3,0,frameW3,frameH3);
}

/* ================= 玩家 ================= */
function drawPlayer(){
  let px=sx(playerX), py=sy(playerY);
  let sheet;

  if(playerState==="idle"){
    sheet=playerIdle;
    image(sheet,px-sheet.width,py-sheet.height, 
      sx(sheet.width*3),sy(sheet.height*3)); 
  }else{
    sheet=playerState==="up"?playerUp:
          playerState==="down"?playerDown:
          playerState==="left"?playerLeft:
          playerRight;
    let fw=sheet.width/4; 
    if(++playerAnimCounter%10===0) playerFrame=(playerFrame+1)%4;
    image(sheet,px-fw,py-sheet.height,
      sx(fw*3),sy(sheet.height*3),
      playerFrame*fw,0,fw,sheet.height); 
  }
  if(!showIntro) updatePlayerMovement();
}

/* ================= 小精靈 ================= */
function drawFairy(){
  if(++fairyCounter%12===0) fairyFrame=(fairyFrame+1)%fairyFrameCount;
  image(fairySheet,
    sx(playerX-80),
    sy(playerY-120)+sin(frameCount*0.05)*sy(8),
    sx(fairyFrameW*2),
    sy(fairyFrameH*2),
    fairyFrame*fairyFrameW,0,fairyFrameW,fairyFrameH);
}

/* ================= E 互動 ================= */
function drawInteractionHint(){
  if(showIntro) return;
  if(gameState!=="free"||getNearestAsker()===-1) return;
  fill(0,180); rect(sx(840),sy(980),sx(240),sy(34),8);
  fill(255); textAlign(CENTER,CENTER); textSize(sy(18));
  text("按 E 進行互動",sx(960),sy(997));
}

/* ================= 題目面板 ================= */
function drawQuestionPanel(){
  fill(255,240); stroke(0); strokeWeight(3);
  rect(sx(240),sy(40),sx(1440),sy(240),20);

  fill(0); noStroke();
  textAlign(CENTER,TOP);
  textSize(sy(28));
  text(activeQuestion.q,sx(960),sy(60));

  textSize(sy(22));
  text(
    "1. "+activeQuestion.a+
    "\n2. "+activeQuestion.b+
    "\n3. "+activeQuestion.c,
    sx(960),sy(120)
  );
}

/* ================= 對話框 ================= */
function drawDialogBox(){
  if(dialogTimer<=0) return;
  dialogTimer--;

  fill(255,230); stroke(0); strokeWeight(3);
  rect(sx(380),sy(820),sx(1160),sy(120),16);

  fill(0); noStroke();
  textAlign(CENTER,CENTER);
  textSize(sy(24));
  text(dialogText,sx(960),sy(880));
}

/* ================= CSV ================= */
function parseQuestions(){
  rawQuestions.slice(1).forEach(r=>{
    let c=r.split(",");
    questions.push({
      q:c[1],a:c[2],b:c[3],c:c[4],
      correct:c[5],
      correctMsg:c[6],
      wrongMsg:c[7],
      hint:c[8]
    });
  });
}

/* ================= 操作 ================= */
function keyPressed(){
  if(showIntro){ showIntro=false; return; }

  if(!bgmStarted){ userStartAudio(); bgm.loop(); bgmStarted=true; }

  if(keyCode===69 && gameState==="free"){
    activeAsker=getNearestAsker();
    if(activeAsker===-1) return;
    let a=askers[activeAsker];
    if(a.done){ showDialog("您已完成我的問題",120); return; }
    activeQuestion=questions[a.start+a.answered];
    gameState="question";
  }

  if(gameState==="question" && keyCode>=49 && keyCode<=51){
    let choice="ABC"[keyCode-49];
    let a=askers[activeAsker];
    if(choice===activeQuestion.correct){
      showDialog(activeQuestion.correctMsg,180);
      a.answered++;
      if(a.answered>=2){ a.done=true; gameState="free"; }
      else activeQuestion=questions[a.start+a.answered];
    }else showDialog(activeQuestion.wrongMsg,180);
  }
}

/* ================= 小精靈點擊 ================= */
function mousePressed(){
  if(showIntro) return;
  let fx=sx(playerX-80+fairyFrameW);
  let fy=sy(playerY-120+fairyFrameH);
  if(dist(mouseX,mouseY,fx,fy)<sx(40)){
    showDialog(
      gameState==="question"?activeQuestion.hint:"有事說事，別沒事找事",
      150
    );
  }
}

/* ================= 工具 ================= */
function showDialog(t,time){ dialogText=t; dialogTimer=time; }

function getNearestAsker(){
  if(dist(sx(playerX),sy(playerY),sx(1720),sy(540))<sx(120)) return 0;
  if(dist(sx(playerX),sy(playerY),sx(80),sy(540))<sx(120)) return 1;
  if(dist(sx(playerX),sy(playerY),sx(960),sy(80))<sx(120)) return 2;
  return -1;
}

function updatePlayerMovement(){
  let speed=3;
  let moving=false;
  if(keyIsDown(LEFT_ARROW)){ playerX-=speed; playerState="left"; moving=true; }
  if(keyIsDown(RIGHT_ARROW)){ playerX+=speed; playerState="right"; moving=true; }
  if(keyIsDown(UP_ARROW)){ playerY-=speed; playerState="up"; moving=true; }
  if(keyIsDown(DOWN_ARROW)){ playerY+=speed; playerState="down"; moving=true; }
  if(!moving) playerState="idle";
}
