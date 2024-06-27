from flask import Flask, request, make_response, g
import jwt
import sqlite3

app=Flask("alma")
secret="aaaaaaaaaaaaaaaaaaaaaa"


DATABASE = 'adatbazis.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

@app.before_request
def ads():
    if request.method == 'OPTIONS':
        resp = make_response()
        resp.headers['Access-Control-Allow-Origin'] = '*'
        resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return resp
    if request.path!="/login" and request.path!="/index" and request.path!="/cikk" and request.path!="/cikk/kommentlista" and request.path!="/search":
        if not request.headers.get("Authorization"):
            response = make_response({ "status": "error", "error": "Bejelentkezés szükséges." })
            response.headers['Access-Control-Allow-Origin'] = "*"
            return response, 401
        else:
            try:
                decoded_token=jwt.decode(request.headers.get("Authorization"),secret,algorithms="HS256")
            except jwt.DecodeError:
                response = make_response({ "status": "error", "error": "Bejelentkezés szükséges." })
                response.headers['Access-Control-Allow-Origin'] = "*"
                return response, 401



@app.route("/login", methods=["POST"])
def br():
    data=request.get_json(force=True)
    db=get_db().cursor()
    if db.execute("select user from felhasznalok where user=?", (data["username"],)).fetchone()==None:
        db.execute("insert into felhasznalok(user, password) values(?,?)", (data["username"], data["password"]))
        get_db().commit()
        user_t=db.execute("select * from felhasznalok where user=?", (data["username"],)).fetchone()
        token=jwt.encode({"username":user_t[0]},secret,algorithm="HS256")
        response = make_response({"tokenkey":token,"write":user_t[2]})
        response.headers['Access-Control-Allow-Origin'] = "*"
        return response, 200
    else:
        password_real=db.execute("select password from felhasznalok where user=?", (data["username"],)).fetchone()[0]
        if data["password"]==password_real:
            user_t=db.execute("select * from felhasznalok where user=?", (data["username"],)).fetchone()
            token=jwt.encode({"username":user_t[0]},secret,algorithm="HS256")
            response = make_response({"tokenkey":token,"write":user_t[2]})
            response.headers['Access-Control-Allow-Origin'] = "*"
            return response, 200
        else:
            response = make_response({ "status": "error", "error": "Bejelentkezés szükséges." })
            response.headers['Access-Control-Allow-Origin'] = "*"
            return response, 401


@app.route("/write/save", methods=["POST"])
def mentes():
    data=request.get_json(force=True)
    db=get_db().cursor()
    decoded_token=jwt.decode(data["token"],secret,algorithms="HS256")
    
    if not data["title"]:
        response = make_response({ "status": "error", "error": "Cím szükséges." })
        response.headers['Access-Control-Allow-Origin'] = "*"
        return response, 400
    if not data["content"]:
        response = make_response({ "status": "error", "error": "Tartalom szükséges." })
        response.headers['Access-Control-Allow-Origin'] = "*"
        return response, 400
    if not data["file"]:
        response = make_response({ "status": "error", "error": "Kép szükséges." })
        response.headers['Access-Control-Allow-Origin'] = "*"
        return response, 400
    tagellenorzes=data["tags"].split(" ")
    for elem in tagellenorzes:
        if elem[0]!="#":
            response = make_response({ "status": "error", "error": "Rossz tag formátum" })
            response.headers['Access-Control-Allow-Origin'] = "*"
            return response, 400
    
    if not data["id"]:
        db.execute("insert into cikkek(cim, kep, tagek, szoveg, iro) values(?,?,?,?,?)", (data["title"], data["file"], data["tags"], data["content"], decoded_token["username"]))
        get_db().commit()
        idback=db.execute("select id from cikkek where iro = ? ORDER BY ID DESC limit 1", (decoded_token["username"],)).fetchone()[0]
        response = make_response({"id":idback})
        response.headers['Access-Control-Allow-Origin'] = "*"
        return response, 200
    
    else:
        db.execute("update cikkek set cim=?, kep=?, tagek=?, szoveg=? where id=?", (data["title"], data["file"], data["tags"], data["content"], data["id"]))
        get_db().commit()
        response = make_response({"id":data["id"]})
        response.headers['Access-Control-Allow-Origin'] = "*"
        return response, 200


@app.route("/write/publish", methods=["POST"])
def kozzetetel():
    data=request.get_json(force=True)
    db=get_db().cursor()
    db.execute("update cikkek set közzetett=1 where id=?", (data["id"],))
    get_db().commit()
    response = make_response("OK")
    response.headers['Access-Control-Allow-Origin'] = "*"
    return response, 200

@app.route("/write/load1", methods=["POST", "GET"])
def betoltes():
    data=request.get_json(force=True)
    decoded_token=jwt.decode(data["token"],secret,algorithms="HS256")
    db=get_db().cursor()
    osszes=db.execute("select * from cikkek where iro=? and közzetett=0 ORDER BY ID DESC", (decoded_token["username"],)).fetchall()
    osszeslista=[]
    for sor in osszes:
        alakitas={"id":sor[0], "cim":sor[1]}
        osszeslista.append(alakitas)
    response = make_response(osszeslista)
    response.headers['Access-Control-Allow-Origin'] = "*"
    return response, 200

@app.route("/write/load2", methods=["POST", "GET"])
def betoltes2():
    data=request.get_json(force=True)
    db=get_db().cursor()
    cikk=db.execute("select * from cikkek where id=?", (data["id"],)).fetchone()
    response = make_response({"id":cikk[0], "cim":cikk[1], "kep":cikk[2], "tagek":cikk[3], "szoveg":cikk[4]})
    response.headers['Access-Control-Allow-Origin'] = "*"
    return response, 200


@app.route("/search", methods=["POST"])
def kereses():
    data=request.get_json(force=True)
    db=get_db().cursor()
    asd=f"select * from cikkek where közzetett=1 and (cim like '%{data['searchword']}%' or szoveg like '%{data['searchword']}%') and tagek like '%{data['searchtag']}%' and iro like '%{data['searchcreator']}%' ORDER BY ID DESC"
    osszes=db.execute(asd).fetchall()
    osszeslista=[]
    for sor in osszes:
        cim=f"{sor[1]}\nÍrta: {sor[5]}"
        alakitas={"id":sor[0], "cim":cim, "kep":sor[2]}
        osszeslista.append(alakitas)
    response = make_response(osszeslista)
    response.headers['Access-Control-Allow-Origin'] = "*"
    return response, 200



@app.route("/settings", methods=["POST"])
def beallitasok():
    data=request.get_json(force=True)
    db=get_db().cursor()
    decoded_token=jwt.decode(data["token"],secret,algorithms="HS256")
    if data.get("newname"):
        db.execute("update felhasznalok set user=? where user=?", (data["newname"],decoded_token["username"]))
        get_db().commit()
        user_t=db.execute("select * from felhasznalok where user=?", (data["newname"],)).fetchone()
        token=jwt.encode({"username":user_t[0]},secret,algorithm="HS256")
        response = make_response({"tokenkey":token,"write":user_t[2]})
        response.headers['Access-Control-Allow-Origin'] = "*"
        return response, 200        
    elif data.get("newpassword"):
        db.execute("update felhasznalok set password=? where user=?", (data["newpassword"],decoded_token["username"]))
        get_db().commit()
        return "OK"
    else:
        print("huh")
        return "error", 401
    
@app.route("/index")
def osszeshir():
    db=get_db().cursor()
    osszes=db.execute("select * from cikkek where közzetett=1 ORDER BY ID DESC").fetchall()
    osszeslista=[]
    for sor in osszes:
        cim=f"{sor[1]}\nÍrta: {sor[5]}"
        alakitas={"id":sor[0], "cim":cim, "kep":sor[2]}
        osszeslista.append(alakitas)
    response = make_response(osszeslista)
    response.headers['Access-Control-Allow-Origin'] = "*"
    return response, 200

@app.route("/cikk",methods=["POST"])
def cikk():
    data=request.get_json(force=True)
    db=get_db().cursor()
    cikk=db.execute("select * from cikkek where id=?",(data["id"],)).fetchone()
    szoveg=f"{cikk[4]}\n\nÍrta: {cikk[5]}"
    response = make_response({"id":cikk[0], "cim":cikk[1], "kep":cikk[2], "szoveg": szoveg})
    response.headers['Access-Control-Allow-Origin'] = "*"
    return response, 200

@app.route("/cikk/kommenteles",methods=["POST"])
def kommenteles():
    data=request.get_json(force=True)
    db=get_db().cursor()
    decoded_token=jwt.decode(data["token"],secret,algorithms="HS256")
    if data.get("komment"):
        db.execute("insert into kommentek(kommentiro, komment, cikkid) values(?,?,?)",(decoded_token["username"],data["komment"], data["cikkid"]))
        get_db().commit()
        response = make_response("ok")
        response.headers['Access-Control-Allow-Origin'] = "*"
        return response, 200
    else:
        response = make_response("error")
        response.headers['Access-Control-Allow-Origin'] = "*"
        return response, 401

@app.route("/cikk/kommentlista",methods=["POST"])
def kommentlista():
    data=request.get_json(force=True)
    db=get_db().cursor()
    osszes=db.execute("select * from kommentek where cikkid=?", (data["cikkid"],)).fetchall()
    osszeslista=[]
    for sor in osszes:
        alakitas={"id":sor[0], "kommentiro":sor[1], "komment":sor[2]}
        osszeslista.append(alakitas)
    response = make_response(osszeslista)
    response.headers['Access-Control-Allow-Origin'] = "*"
    return response, 200



app.run()


#token validáció
#kommentelés és listázás
#esetleg írói jog kiadása
