(() => {
  "use strict";

  const A=window.AkisStudio;

  const validateProject=(input)=>{
    const data=
      typeof input==="string"
        ? JSON.parse(input)
        : input;

    if(
      !data||
      !Array.isArray(data.nodes)||
      !Array.isArray(data.edges)
    ){
      throw new Error(
        "Geçersiz proje"
      );
    }

    return data;
  };

  const projectDownload=()=>{
    const content=JSON.stringify(
      A.serializable(),
      null,
      2
    );

    const blob=new Blob(
      [content],
      {
        type:"application/json"
      }
    );

    A.downloadBlob(
      blob,
      A.safeName("akis")
    );

    A.setStatus(
      "Proje dosyası indirildi"
    );
  };

  A.openProject=async()=>{
    if(
      A.runtime.dirty&&
      !window.confirm(
        "Kaydedilmemiş değişiklikler var. "+
        "Yine de başka bir proje açılsın mı?"
      )
    ){
      return;
    }

    if(!window.desktopAPI){
      A.$("#ae-file-input").click();
      return;
    }

    try{
      const result=
        await window.desktopAPI.openProject();

      if(result.canceled){
        return;
      }

      const data=
        validateProject(result.data);

      A.runtime.currentFilePath=
        result.filePath;

      A.runtime.dirty=false;

      A.applySnapshot(
        data,
        {
          markDirty:false
        }
      );

      A.state.undo=[];
      A.state.redo=[];

      A.fitDiagram();
      A.updateWindowTitle();

      A.$("#ae-save-state").textContent=
        "Dosya açıldı";

      A.setStatus("Proje açıldı");
    }catch{
      A.setStatus(
        "Dosya açılamadı veya geçerli bir Akış projesi değil"
      );
    }
  };

  A.saveProject=async(saveAs=false)=>{
    if(!window.desktopAPI){
      projectDownload();
      return;
    }

    try{
      const payload={
        name:A.state.name,
        data:JSON.stringify(
          A.serializable(),
          null,
          2
        )
      };

      const result=saveAs
        ? await window.desktopAPI
            .saveProjectAs(payload)
        : await window.desktopAPI
            .saveProject(payload);

      if(result.canceled){
        return;
      }

      A.runtime.currentFilePath=
        result.filePath;

      A.runtime.dirty=false;

      A.$("#ae-save-state").textContent=
        "Dosyaya kaydedildi";

      A.updateWindowTitle();

      A.setStatus(
        saveAs
          ? "Proje farklı kaydedildi"
          : "Proje kaydedildi"
      );
    }catch{
      A.setStatus(
        "Dosya kaydedilemedi"
      );
    }
  };

  A.resetProject=()=>{
    if(
      !window.confirm(
        "Mevcut diyagram temizlensin mi? "+
        "Önce projeyi kaydedebilirsin."
      )
    ){
      return;
    }

    A.pushHistory();

    A.state.nodes=[];
    A.state.edges=[];
    A.state.selectedNode=null;
    A.state.selectedNodes=[];
    A.state.selectedEdge=null;
    A.state.name="İsimsiz Diyagram";

    A.runtime.currentFilePath=null;

    window.desktopAPI
      ?.clearProjectPath();

    A.$("#ae-doc-name").value=
      A.state.name;

    A.render();
    A.scheduleSave();

    A.setStatus(
      "Yeni diyagram hazır"
    );
  };

  A.importProject=(file)=>{
    const reader=new FileReader();

    reader.onload=()=>{
      try{
        const data=validateProject(
          String(reader.result)
        );

        A.pushHistory();

        A.runtime.currentFilePath=null;

        A.applySnapshot(data);
        A.fitDiagram();

        A.setStatus("Proje açıldı");
      }catch{
        A.setStatus(
          "Bu dosya geçerli bir Akış projesi değil"
        );
      }
    };

    reader.readAsText(file);
  };

  A.executeCommand=(command)=>{
    if(command==="new"){
      A.resetProject();
    }else if(command==="open"){
      A.openProject();
    }else if(command==="save"){
      A.saveProject(false);
    }else if(command==="save-as"){
      A.saveProject(true);
    }else if(command==="export"){
      A.$("#ae-export-dialog")
        .showModal();
    }else if(command==="undo"){
      A.undo();
    }else if(command==="redo"){
      A.redo();
    }else if(command==="duplicate"){
      A.duplicateSelected();
    }else if(command==="delete"){
      A.deleteSelection();
    }else if(command==="fit"){
      A.fitDiagram();
    }else if(command==="toggle-palette"){
      A.togglePalette();
    }else if(command==="toggle-grid"){
      A.state.grid=!A.state.grid;
      A.render();
      A.scheduleSave();
    }else if(
      command.startsWith("theme:")
    ){
      A.setTheme(
        command.split(":")[1],
        false
      );
    }
  };

  const registerProjectEvents=()=>{
    A.$("#ae-new")
      .addEventListener(
        "click",
        A.resetProject
      );

    A.$("#ae-save")
      .addEventListener(
        "click",
        ()=>{
          A.saveProject(false);
        }
      );

    A.$("#ae-save-as")
      .addEventListener(
        "click",
        ()=>{
          A.saveProject(true);
        }
      );

    A.$("#ae-import")
      .addEventListener(
        "click",
        A.openProject
      );

    A.$("#ae-import-data")
      .addEventListener(
        "click",
        A.openProject
      );

    A.$("#ae-file-input")
      .addEventListener(
        "change",
        (event)=>{
          const file=
            event.target.files[0];

          if(file){
            A.importProject(file);
          }

          event.target.value="";
        }
      );

    A.$("#ae-doc-name")
      .addEventListener(
        "input",
        (event)=>{
          A.state.name=
            event.target.value;

          A.scheduleSave();
        }
      );

    window.desktopAPI
      ?.onMenuCommand(
        A.executeCommand
      );

    A.root.addEventListener(
      "keydown",
      (event)=>{
        const mod=
          event.ctrlKey||
          event.metaKey;

        const key=
          event.key.toLowerCase();

        if(mod&&key==="s"){
          event.preventDefault();
          A.saveProject(event.shiftKey);
        }else if(mod&&key==="o"){
          event.preventDefault();
          A.openProject();
        }else if(mod&&key==="n"){
          event.preventDefault();
          A.resetProject();
        }else if(mod&&key==="e"){
          event.preventDefault();

          A.$("#ae-export-dialog")
            .showModal();
        }else if(
          mod&&
          event.shiftKey&&
          key==="b"
        ){
          event.preventDefault();
          A.togglePalette();
        }else if(
          mod&&
          event.shiftKey&&
          key==="g"
        ){
          event.preventDefault();

          A.state.grid=!A.state.grid;
          A.render();
          A.scheduleSave();
        }
      }
    );
  };

  const restore=()=>{
    try{
      const theme=
        localStorage.getItem(
          A.keys.theme
        )||
        "system";

      A.setTheme(theme,false);

      A.runtime.savedShapes=
        JSON.parse(
          localStorage.getItem(
            A.keys.shapes
          )||
          "[]"
        );

      if(
        !Array.isArray(
          A.runtime.savedShapes
        )
      ){
        A.runtime.savedShapes=[];
      }

      const saved=
        localStorage.getItem(
          A.keys.project
        );

      if(saved){
        const data=
          validateProject(saved);

        A.applySnapshot(
          data,
          {
            markDirty:false
          }
        );
      }

      const paletteWidth=
        Number(
          localStorage.getItem(
            A.keys.paletteWidth
          )
        )||
        272;

      A.setPaletteWidth(
        paletteWidth,
        false
      );

      const collapsed=
        localStorage.getItem(
          A.keys.paletteCollapsed
        )==="true";

      A.setPaletteCollapsed(
        collapsed,
        false
      );
    }catch{
      A.runtime.savedShapes=[];
    }

    A.runtime.dirty=false;

    A.$("#ae-save-state").textContent=
      "Yerel yedek hazır";
  };

  if(
    A.root.dataset.ready==="true"
  ){
    return;
  }

  A.registerSidebar();
  A.registerToolbar();
  A.registerExport();
  A.registerInteractions();
  registerProjectEvents();
  A.ensureMarkerVariants();
  restore();
  A.renderSavedShapes();
  A.render();
  A.updateWindowTitle();

  A.root.dataset.ready="true";

  setTimeout(
    A.fitDiagram,
    80
  );
})();