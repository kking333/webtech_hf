
thumbnailfile.onchange = evt => {
    const [file] = thumbnailfile.files
    if (file) {
        thumbnailpreview.src = URL.createObjectURL(file)
    }
  }

function dashboard(){
    if (document.getElementById("dashboard").style.display=="none"){
        document.getElementById("dashboard").style.display="flex";
    }
    else {
        document.getElementById("dashboard").style.display="none";
    }
}




function checkload(){
    if(localStorage.getItem("write")==="0"){
        document.getElementById("cikkiras").style.display="none"
    }
    if(localStorage.getItem("token")){
        document.getElementById("dashbejelentkezesdiv").style.display="none"
        document.getElementById("dashregisztraciodiv").style.display="none"
        document.getElementById("jf").style.display="none"
        document.getElementById("jf2").style.display="flex"
        document.getElementById("dashbeallitasokdiv").style.display="flex"
    }
    else{
        document.getElementById("cikkiras").style.display="none"
    }

}

function deletetoken(){
    localStorage.removeItem("token")
    window.location='index.html'
}

function atiranyitas(elem){
    let id=elem.id
    window.location="cikk.html?id="+id
}

function cikkonload(){
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const id = urlParams.get('id')
    let xmh=new XMLHttpRequest()
    xmh.open("POST", "http://127.0.0.1:5000/cikk", true)
    xmh.onreadystatechange = function() { 
        if (xmh.readyState == 4 && xmh.status == 200){
            var res=JSON.parse(xmh.responseText)
            document.getElementById("cikkep").src=res["kep"]
            document.getElementById("cikkcim").innerText=res["cim"]
            document.getElementById("cikkszoveg").innerText=res["szoveg"]
        }
    }
    xmh.send(JSON.stringify({"id":id}))

}

function osszeshir(){
    let bottomid=document.getElementById("bottombar")
    let xmh=new XMLHttpRequest()
    xmh.open("GET", "http://127.0.0.1:5000/index", true)
    xmh.onreadystatechange = function() { 
        if (xmh.readyState == 4 && xmh.status == 200){
            var res=JSON.parse(xmh.responseText)
            console.log(res)
            for( let index=0; index<res.length; index++){
                
                let hir=document.createElement("div")
                bottomid.appendChild(hir)
                hir.classList.add("hir")
                hir.classList.add("bottomdiv")
                let kep=document.createElement("img")
                let cimdiv=document.createElement("div")
                cimdiv.id="hircim"
                hir.appendChild(kep)
                hir.appendChild(cimdiv)
                cimdiv.innerText=res[index]["cim"]
                kep.src=res[index]["kep"]
                hir.id=res[index]["id"]
                hir.setAttribute("onclick", "atiranyitas(this)")

            }
        }
    }
    xmh.send(null)
}

function rb(){
    let nev=document.getElementById("nevinput-rb").value
    let jelszo=document.getElementById("jelszoinput-rb").value
    let xmh=new XMLHttpRequest()
    xmh.open("POST", "http://127.0.0.1:5000/login", true)
    xmh.onreadystatechange = function() { 
        if (xmh.readyState == 4 && xmh.status == 200){
            var res=JSON.parse(xmh.responseText)
            localStorage.setItem("token",res["tokenkey"])
            localStorage.setItem("write",res["write"])
            window.location="index.html"
            }
        }
        
    xmh.send(JSON.stringify({"username":nev, "password":jelszo}))
}

function isloggedin(){
    if (localStorage.getItem("token")){
        return true
    }
    else {
        return false
    }
}

function logout(){
    localStorage.removeItem('token')
}

function mentes(){
    let file=document.getElementById("thumbnailfile").files[0]
    let cim=document.getElementById("w2cim").value
    let tagek=document.getElementById("w2tag").value
    let szoveg=document.getElementById("szovegszerk").value
    let dummy=document.querySelector(".dummydiv")
    var reader = new FileReader();
    var base64;
    reader.onload = function (r) {
        var fileInfo = new Object();
        fileInfo.name = file.name;
        fileInfo.size = file.size;
        fileInfo.extension = file.name.split(".")[file.name.split(".").length - 1];

        let xmh=new XMLHttpRequest()
        xmh.open("POST", "http://127.0.0.1:5000/write/save", true)
        xmh.onreadystatechange = function() { 
            if (xmh.readyState == 4 && xmh.status == 200){
                var res=JSON.parse(xmh.responseText)
                dummy.id=res["id"]
                document.getElementById("w2kozzetetel").style.display="block"
            }
            if (xmh.readyState == 4 && xmh.status == 400){
                var res=JSON.parse(xmh.responseText)
                alert(res["error"])
            }
        }

        xmh.setRequestHeader("Authorization", localStorage.getItem("token"))
        xmh.send(JSON.stringify({"file":r.target.result, "title":cim, "tags":tagek, "content":szoveg, "token":localStorage.getItem("token"), "id":dummy.id}))

        };
    reader.onerror = function (ex) {
        console.error(ex);
    };
    if (file){
        reader.readAsDataURL(file);
    }
    else{
        let xmh=new XMLHttpRequest()
        let img=document.getElementById("thumbnailpreview").src
        xmh.open("POST", "http://127.0.0.1:5000/write/save", true)
        xmh.onreadystatechange = function() { 
            if (xmh.readyState == 4 && xmh.status == 200){
                var res=JSON.parse(xmh.responseText)
                dummy.id=res["id"]
                document.getElementById("w2kozzetetel").style.display="block"
            }
            if (xmh.readyState == 4 && xmh.status == 400){
                var res=JSON.parse(xmh.responseText)
                alert(res["error"])
            }
        }

        xmh.setRequestHeader("Authorization", localStorage.getItem("token"))
        xmh.send(JSON.stringify({"file":img, "title":cim, "tags":tagek, "content":szoveg, "token":localStorage.getItem("token"), "id":dummy.id}))
    }
}

function kozzetetel(){
    mentes()
    let dummy=document.querySelector(".dummydiv").id
    let xmh=new XMLHttpRequest()
    xmh.open("POST", "http://127.0.0.1:5000/write/publish", true)
    xmh.setRequestHeader("Authorization", localStorage.getItem("token"))
    xmh.onreadystatechange = function() { 
        if(xmh.readyState == 4 && xmh.status == 200){
            alert("Sikeres közzététel")
        }
    }
    xmh.send(JSON.stringify({"id":dummy}))

}


function keresestorles(){
    let elemek=Array.from(document.getElementById("bottombar").childNodes)
    for(let index=0;index<elemek.length;index++){
        if (elemek[index].id!="w2kereses"){
            elemek[index].remove()
        }
    }
}


function kereses(){
    keresestorles()
    let kulcsszo=document.getElementById("szokereses").value
    if(kulcsszo=="")
        kulcsszo="%"
    let tag=document.getElementById("tagkereses").value
    if(tag=="")
        tag="%"
    let keszito=document.getElementById("irokereses").value
    if(keszito=="")
        keszito="%"
    let bottomid=document.getElementById("bottombar")
    let xmh=new XMLHttpRequest()
    xmh.open("POST", "http://127.0.0.1:5000/search", true)
    xmh.onreadystatechange = function() { 
        if (xmh.readyState == 4 && xmh.status == 200){
            var res=JSON.parse(xmh.responseText)
            console.log(res)
            for( let index=0; index<res.length; index++){
                let hir=document.createElement("div")
                bottomid.appendChild(hir)
                hir.classList.add("hir")
                hir.classList.add("bottomdiv")
                let kep=document.createElement("img")
                let cimdiv=document.createElement("div")
                cimdiv.id="hircim"
                hir.appendChild(kep)
                hir.appendChild(cimdiv)
                cimdiv.innerText=res[index]["cim"]
                kep.src=res[index]["kep"]
                hir.id=res[index]["id"]
                hir.setAttribute("onclick", "atiranyitas(this)")

            }
        }
    }
    xmh.send(JSON.stringify({"searchword":kulcsszo, "searchtag":tag, "searchcreator":keszito}))

}

function betoltesmegjelenites(){
    if (document.getElementById("betoltesdiv").style.display=="none"){
        document.getElementById("betoltesdiv").style.display="flex";
    }
    else {
        document.getElementById("betoltesdiv").style.display="none";
    }
}

function betoltestorles(){
    let elemek=Array.from(document.getElementById("betolteslista").childNodes)
    console.log(elemek)
    for(let index=0;index<elemek.length;index++){
        console.log(elemek[index])
        elemek[index].remove()
    }
}

function betolteslekeres(){
    let betolteslista=document.getElementById("betolteslista")
    let xmh=new XMLHttpRequest()
    xmh.open("POST", "http://127.0.0.1:5000/write/load1", true)
    xmh.onreadystatechange = function() { 
        if (xmh.readyState == 4 && xmh.status == 200){
            var res=JSON.parse(xmh.responseText)
            console.log(res)
            for( let index=0; index<res.length; index++){
                let cim=document.createElement("div")
                betolteslista.appendChild(cim)
                cim.classList.add("betoltescimek")
                cim.id=res[index]["id"]
                cim.innerText=res[index]["cim"]
                cim.setAttribute("onclick","betoltes(this);betoltestorles()")
                
            }
        }
    }
    xmh.setRequestHeader("Authorization", localStorage.getItem("token"))
    xmh.send(JSON.stringify({"token":localStorage.getItem("token")}))
}

function betoltes(elemek){
    let id = elemek.id
    let dummy = document.querySelector(".dummydiv")
    let xmh=new XMLHttpRequest()
    xmh.open("POST", "http://127.0.0.1:5000/write/load2", true)
    xmh.setRequestHeader("Authorization", localStorage.getItem("token"))
    xmh.onreadystatechange = function() { 
        if (xmh.readyState == 4 && xmh.status == 200)
            var res=JSON.parse(xmh.responseText)
            document.getElementById("thumbnailpreview").src=res["kep"]
            document.getElementById("w2cim").value=res["cim"]
            document.getElementById("w2tag").value=res["tagek"]
            document.getElementById("szovegszerk").value=res["szoveg"]
            dummy.id=res["id"]
            betoltesmegjelenites()
            document.getElementById("w2kozzetetel").style.display="block"

        }
    xmh.send(JSON.stringify({"id":id}))


}

function nevvaltoz(){
    let ujnev=document.getElementById("ujnev").value
    let xmh=new XMLHttpRequest()
    xmh.open("POST", "http://127.0.0.1:5000/settings", true)
    xmh.setRequestHeader("Authorization", localStorage.getItem("token"))
    xmh.onreadystatechange = function() { 
        if (xmh.readyState == 4 && xmh.status == 200)
            var res=JSON.parse(xmh.responseText)
            localStorage.setItem("token",res["tokenkey"])
            localStorage.setItem("write",res["write"])
        }
    xmh.send(JSON.stringify({"newname":ujnev, "token":localStorage.getItem("token")}))
}

function jelszovaltoz(){
    let ujjelszo=document.getElementById("ujjelszo").value
    let xmh=new XMLHttpRequest()
    xmh.open("POST", "http://127.0.0.1:5000/settings", true)
    xmh.setRequestHeader("Authorization", localStorage.getItem("token"))
    xmh.send(JSON.stringify({"newpassword":ujjelszo, "token":localStorage.getItem("token")}))

}

function kommentiras(){
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const id = urlParams.get('id')
    let komment=document.getElementById("kommentiras").value
    let xmh=new XMLHttpRequest()
    xmh.open("POST", "http://127.0.0.1:5000/cikk/kommenteles", true)
    xmh.setRequestHeader("Authorization", localStorage.getItem("token"))
    xmh.onreadystatechange = function() { 
        if (xmh.readyState == 4 && xmh.status == 400)
            alert("Sikertelen kommentelés")
        }
    xmh.send(JSON.stringify({"komment":komment, "token":localStorage.getItem("token"), "cikkid":id}))
    document.getElementById("kommentiras").value=""


}

function kommentlistázás(){
    let kommentlista=document.getElementById("kommentlist")
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const id = urlParams.get('id')
    let xmh=new XMLHttpRequest()
    xmh.open("POST", "http://127.0.0.1:5000/cikk/kommentlista", true)
    xmh.onreadystatechange = function() { 
        if (xmh.readyState == 4 && xmh.status == 200){
            var res=JSON.parse(xmh.responseText)
            console.log(res)
            for( let index=0; index<res.length; index++){
                let komment=document.createElement("div")
                kommentlista.appendChild(komment)
                komment.classList.add("komment")
                let kommentelo=document.createElement("kommentelo")
                let kommentelokommentje=document.createElement("kommentelokommentje")
                kommentelo.id="kommentelo"
                kommentelokommentje.id="kommentelokommentje"
                komment.appendChild(kommentelo)
                komment.appendChild(kommentelokommentje)
                kommentelo.innerText=res[index]["kommentiro"]
                kommentelokommentje.innerText=res[index]["komment"]
                
            }
        }
    }
    xmh.setRequestHeader("Authorization", localStorage.getItem("token"))
    xmh.send(JSON.stringify({"cikkid":id}))

}