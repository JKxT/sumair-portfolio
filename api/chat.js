var https = require('https');
module.exports = function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  var key = process.env.GROQ_API_KEY;
  if (!key) return res.status(500).json({error:'GROQ_API_KEY not set'});
  var msgs = [];
  if (req.body.system) msgs.push({role:'system', content:req.body.system});
  (req.body.messages||[]).forEach(function(m) {
    var c = typeof m.content === 'string' ? m.content : (m.content||[]).filter(function(b){return b.type==='text';}).map(function(b){return b.text;}).join('');
    msgs.push({role:m.role, content:c});
  });
  var data = JSON.stringify({model:'llama-3.3-70b-versatile', messages:msgs, max_tokens:req.body.max_tokens||600});
  var opts = {hostname:'api.groq.com', path:'/openai/v1/chat/completions', method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+key,'Content-Length':Buffer.byteLength(data)}};
  var r = https.request(opts, function(resp) {
    var d = '';
    resp.on('data', function(c){d+=c;});
    resp.on('end', function() {
      try {
        var p = JSON.parse(d);
        var t = p.choices && p.choices[0] && p.choices[0].message ? p.choices[0].message.content : '';
        res.status(200).json({content:[{type:'text',text:t}]});
      } catch(e) { res.status(500).json({error:'parse error'}); }
    });
  });
  r.on('error', function(e){res.status(500).json({error:e.message});});
  r.write(data);
  r.end();
};
