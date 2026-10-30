import test from 'node:test';
import assert from 'node:assert/strict';
import {websocketServer} from './ws-fixture.mjs';
import {probe} from './probe.mjs';
test('LAPLACE plugin authenticates, answers heartbeats and normalizes deduplicated chat',async()=>{
 let authenticated=false,pong=false;
 const server=await websocketServer({opened(socket,request,send){authenticated=new URL(request.url,'http://localhost').searchParams.get('token')==='test-token';send(socket,{type:'ping',timestamp:1});},message(value){if(value.type==='pong')pong=true;}});
 const process=await probe({enabled:true,url:server.url,token:'test-token',startLocalBridge:false});
 try{
  await process.next(value=>value.topic==='status'&&value.data.state==='connected');
  const message={type:'message',id:'one',origin:'test',uid:42,username:'观众',userLvl:9,message:'Hello',timestampNormalized:1700000000000};
  for(const socket of server.clients){server.send(socket,message);server.send(socket,message);server.send(socket,{type:'gift',id:'two',origin:'test',uid:42,username:'观众',giftName:'花',num:2});}
  const chat=await process.next(value=>value.topic==='chat.message'),gift=await process.next(value=>value.topic==='chat.gift');
  assert.ok(authenticated&&pong);assert.equal(chat.data.user.name,'观众');assert.equal(chat.data.timestamp,1700000000000);assert.equal(gift.data.user.level,9);assert.equal(gift.data.gift.count,2);
  assert.equal(process.records.filter(value=>value.topic==='chat.message').length,1);assert.ok(!JSON.stringify(process.records).includes('test-token'));
 }finally{await process.stop();server.close();}
});
