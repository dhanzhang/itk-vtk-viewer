import vtkURLExtract from "vtk.js/Sources/Common/Core/URLExtract";

import getRootContainer from "./getRootContainer";
import preventDefaults from "./preventDefaults";

import style from "./ItkVtkViewer.mcss";
import Mousetrap from "mousetrap";
import fetchBinaryContent from "../fetchBinaryContent";

const MOUSETRAP = new Mousetrap();

// function createFileDragAndDrop(container, onDataChange) {
//   const myContainer = getRootContainer(container);
//
//   const fileContainer = document.createElement('div');
//   fileContainer.innerHTML = `<div class="${
//     style.bigFileDrop
//   }"/><input type="file" class="file" style="display: none;" multiple/>`;
//   myContainer.appendChild(fileContainer);
//
//   const fileInput = fileContainer.querySelector('input');
//
//   MOUSETRAP.bind('enter', (event) => {
//     fileInput.click();
//   })
//
//   function handleFile(e) {
//     preventDefaults(e);
//     MOUSETRAP.unbind('enter');
//     const dataTransfer = e.dataTransfer;
//     const files = e.target.files || dataTransfer.files;
//     myContainer.removeChild(fileContainer);
//     const use2D = !!vtkURLExtract.extractURLParameters().use2D;
//     onDataChange(myContainer, { files, use2D })
//       .catch((error) => {
//         const message = 'An error occurred while loading the file:\n\n' + error.message
//         alert(message);
//         createFileDragAndDrop(container, onDataChange);
//       })
//   }
//
//   fileInput.addEventListener('change', handleFile);
//   fileContainer.addEventListener('drop', handleFile);
//   fileContainer.addEventListener('click', (e) => fileInput.click());
//   fileContainer.addEventListener('dragover', preventDefaults);
// }
const tagStudyInstanceUID = {
  tagKey: "0020000D",
  tagGroup: 0x0020,
  tagElement: 0x000D,
  tagVR: "UI",
  tagDesc: "Study Instance UID"
};

const tagSOPInstanceUID = {
  tagKey: "00080018",
  tagGroup: 0x0008,
  tagElement: 0x0018,
  tagVR: "UI",
  tagDesc: "SOP Instance UID"
};

const StudyInstUid = "1.2.86.76547135.7.5086460.20180320143400";

function GetDcmFile(metaData) {

  let studyInstUID = metaData[tagStudyInstanceUID.tagKey].Value[0];
  // let seriesUID = metaData[tagSeriesInstanceUID.tagKey].Value[0];
  let objectUID = metaData[tagSOPInstanceUID.tagKey].Value[0];
  return `/assets/${studyInstUID}/${objectUID}.DCM`;

  // return  "wadors:" + `/assets/pool/${objectUID}.data`;
}

function loadJson() {

  return new Promise(function(resolve, reject) {

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          //  console.log( xhr.responseText);
          var studyMetadata = JSON.parse(xhr.responseText);
          resolve(studyMetadata);

        } else {
          reject(xhr.statusText);
        }
      }
    };
    xhr.open("GET", `/assets/${StudyInstUid}.json`, true);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.send();
  });

}

function createLoadingProgress(container) {
  const loading = document.createElement('div');
  loading.setAttribute('class', style.loading);
  container.appendChild(loading);

  const progressContainer = document.createElement('div');
  progressContainer.setAttribute('class', style.progress);
  container.appendChild(progressContainer);
  function progressCallback(progressEvent) {
    console.log( "progressEvent:"+ progressEvent.currentTarget );
    const percent = Math.floor(
      100 * progressEvent.loaded / progressEvent.total
    );
    progressContainer.innerHTML = `${percent}%`;
  }

  return progressCallback;
}


function createFileDragAndDrop(container, onDataChange) {
  const myContainer = getRootContainer(container);
  const arr = [];
  const tasks = [];
  const progCallback = createLoadingProgress(container);
  loadJson().then(function(studyMeta) {
    studyMeta.forEach(function(el) {
      const url = GetDcmFile(el);
      arr.push(url);
      tasks.push(fetchBinaryContent(url, progCallback));
    });
    var files =[];
    Promise.all(tasks).then(function(values) {

      values.forEach(function(arrayBuffer, idex) {
        const file = new File(
          [new Blob([arrayBuffer])],
          idex + ".DCM"
        );
        files[idex] = file;
      });
      console.log('fetchFileContent Over!');
      var us2d = true;
      onDataChange( myContainer ,{ files , us2d });
    });
  });

}

export default createFileDragAndDrop;

