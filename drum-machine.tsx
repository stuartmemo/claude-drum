'use client';
import { useEffect, useRef, useState } from 'react';
import tsw from 'theresas-sound-world';
import Drum from './drum-component';
import DrumControls from './drum-controls';
import MachineControls from './machine-controls';
import KitSelect from './components/kit-select';
import drumTypes from 'modules/instruments/beat-petite/drum-types';
import ChatInput from './components/chat-input';
import BeatPetiteStyles from './styles';

const DrumMachine = () => {
  const [activeDrum, setActiveDrum] = useState('kick');
  const [activeKit, setActiveKit] = useState('linndrum');
  const [friendlyName, setFriendlyName] = useState('Kick');
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);
  const [masterVolume, setMasterVolume] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const masterVolumeNode = useRef(null);
  const nextStepTime = useRef(0);
  const scheduleAheadTime = useRef(0.1);
  const requestId = useRef(null);
  const sequence = useRef({});
  const drumSounds = useRef(null);
  const defaultDrumSettings = {};

  drumTypes.forEach((drumType) => {
    defaultDrumSettings[drumType.name] = {
      volume: 1,
      tone: 12000,
      presetPattern: new Array(16).fill(false),
    };
  });

  const [drumSettings, setDrumSettings] = useState(defaultDrumSettings);

  const handleChatBeat = (chatBeat) => {
    drumTypes.forEach((drumType) => {
      if (chatBeat[drumType.name]) {
        drumSettings[drumType.name].presetPattern = chatBeat[drumType.name];
      } else {
        drumSettings[drumType.name].presetPattern = new Array(16).fill(false);
      }
    });

    setActiveKit(chatBeat.kit);
    setBpm(chatBeat.bpm);
    setDrumSettings({ ...drumSettings });
  };

  const handleDrumChange = (newDrum, friendlyName) => {
    setActiveDrum(newDrum);
    setFriendlyName(friendlyName);
  };

  const handleKitChange = (e) => {
    const newKit = e.target.value;
    setActiveKit(newKit);
  };

  const handleStartStop = () => {
    const osc = tsw.osc();
    const vol = tsw.gain(0);
    tsw.connect(osc, vol, tsw.speakers);
    osc.start();
    setIsPlaying((prevIsPlaying) => !prevIsPlaying);
  };

  const handlePatternChange = (name, pattern) => {
    sequence.current[name] = pattern;
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setMasterVolume(newVolume);
  };

  const handleDrumVolumeChange = (newDrumVolume) => {
    if (drumSounds.current && activeDrum) {
      const newDrumSettings = { ...drumSettings };
      newDrumSettings[activeDrum].volume = newDrumVolume;
      setDrumSettings(newDrumSettings);
    }
  };

  useEffect(() => {
    if (drumSounds.current) {
      drumSounds.current[activeDrum].volume.gain(
        drumSettings[activeDrum].volume
      );
      drumSounds.current[activeDrum].tone.frequency.value =
        drumSettings[activeDrum].tone;
    }
  }, [activeDrum, drumSettings]);

  const loadKit = (kit) => {
    if (kit === 'rock') {
      kit = 'pop';
    }

    const basePath = `/instruments/beat-petite/${kit}`;
    const drumArr = drumTypes.map((drum) => `${basePath}/${drum.name}.wav`);
    const drums = {};

    tsw.load(drumArr, (audioBuffers) => {
      Object.keys(audioBuffers).forEach((audioBuffer) => {
        const bufferBox = tsw.bufferBox(audioBuffers[audioBuffer]);
        const volume = tsw.gain();
        const tone = tsw.filter('lowpass');
        tone.frequency(12000);
        const newTone = new BiquadFilterNode(tsw.context(), {
          type: 'lowpass',
          frequency: 200,
        });

        drums[drumTypes[audioBuffer].name] = {
          bufferBox,
          volume: volume,
          tone: newTone,
        };

        tsw.connect(bufferBox, volume, masterVolumeNode.current, tsw.speakers);
      });

      drumSounds.current = drums;
    });
  };

  useEffect(() => {
    masterVolumeNode.current = tsw.gain(0.5);
  }, []);

  useEffect(() => {
    loadKit(activeKit);
  }, [activeKit]);

  useEffect(() => {
    masterVolumeNode.current.gain(masterVolume);
  }, [masterVolume]);

  useEffect(() => {
    const nextStep = () => {
      const secondsPerBeat = 60 / bpm;
      nextStepTime.current += secondsPerBeat / 4;
      setCurrentStep((previousStep) => {
        if (previousStep === 15) {
          return 0;
        }
        return previousStep + 1;
      });
    };

    const scheduleNotes = () => {
      const drums = Object.keys(sequence.current);

      drums.forEach((drum) => {
        if (currentStep === 15) {
          if (sequence.current[drum][0]) {
            tsw.play(drumSounds.current[drum].bufferBox, nextStepTime.current);
          }
        } else {
          if (sequence.current[drum][currentStep + 1]) {
            tsw.play(drumSounds.current[drum].bufferBox, nextStepTime.current);
          }
        }
      });
    };

    window.looper = function looper() {
      while (nextStepTime.current < tsw.now() + scheduleAheadTime.current) {
        scheduleNotes();
        nextStep();
      }

      if (isPlaying) {
        requestId.current = requestAnimationFrame(looper);
      }
    };

    if (isPlaying) {
      looper();
    }

    return () => {
      cancelAnimationFrame(requestId.current);
    };
  }, [bpm, currentStep, isPlaying]);

  return (
    <>
      <ChatInput onChange={handleChatBeat} />
      <div id="drum-machine" className="bg-black mt-0 mx-auto mb-4">
        <h1 className="text-white text-xl font-bold m-0 bg-black pt-1.5 pr-[5px] pb-0.5 pl-4 leading-snug">
          Beat Petite{' '}
          <KitSelect activeKit={activeKit} handleKitChange={handleKitChange} />
        </h1>
        <table className="bg-[#FFE976] border-t-4 border-l-4 border-[#0C0C0C] border-spacing-0">
          <tbody>
            {drumTypes.map(({ name, friendlyName }) => (
              <Drum
                currentStep={currentStep}
                handleDrumChange={(newDrum) =>
                  handleDrumChange(newDrum, friendlyName)
                }
                handlePatternChange={(newPattern) =>
                  handlePatternChange(name, newPattern)
                }
                key={name}
                name={name}
                presetPattern={drumSettings[name]?.presetPattern}
                friendlyName={friendlyName}
              />
            ))}
          </tbody>
        </table>
        <DrumControls
          activeDrum={activeDrum}
          friendlyName={friendlyName}
          handleDrumVolumeChange={handleDrumVolumeChange}
          key={activeDrum}
          settings={drumSettings[activeDrum]}
        />
        <MachineControls
          bpm={bpm}
          handleBpmChange={(e) => setBpm(parseInt(e.target.value, 10))}
          handleStartStop={handleStartStop}
          handleVolumeChange={handleVolumeChange}
          isPlaying={isPlaying}
          masterVolume={masterVolume}
        />

        <BeatPetiteStyles />
      </div>
    </>
  );
};

export default DrumMachne;
