import { useEffect, useMemo, useState } from "react";
import { Button, Flex, Select, Text } from "@radix-ui/themes";

const AudioContext = window.AudioContext;

export function Microphone() {
  const [supported, setSupported] = useState<boolean | undefined>(undefined);
  const [devices, setDevices] = useState<InputDeviceInfo[]>([]);
  const [micId, setMicId] = useState<string | undefined>();
  const [stream, setStream] = useState<MediaStream | undefined>();
  const [audioContext] = useState(new AudioContext());

  const microphoneBuffer = useMemo<{
    input: MediaStreamAudioDestinationNode;
    output: MediaStreamAudioSourceNode;
  }>(() => {
    const streamDestination = audioContext.createMediaStreamDestination();
    const stream = audioContext.createMediaStreamSource(
      streamDestination.stream
    );

    stream.connect(audioContext.destination);
    return { input: streamDestination, output: stream };
  }, [audioContext]);

  const checkSupported = () => {
    if (navigator.mediaDevices && AudioContext) {
      setSupported(true);
    } else {
      setSupported(false);
    }
  };

  useEffect(checkSupported, []);

  const getMicrophones = async () => {
    // First get permission:
    await navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then(() => console.log("success"));

    navigator.mediaDevices.enumerateDevices().then((devices) => {
      devices = devices.filter((d) => d.kind === "audioinput");
      console.log("found devices: ", devices);
      setDevices(devices as InputDeviceInfo[]);
    });
  };

  const start = async () => {
    if (!micId) {
      throw new Error("missing capture device id");
    }
    const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
      // audio: true // constraints - only audio needed for this app
      audio: {
        deviceId: micId,
        autoGainControl: false,
        echoCancellation: false,
        noiseSuppression: false,
      },
    });
    setStream(stream);

    const mediaStream = audioContext.createMediaStreamSource(stream);
    mediaStream.connect(microphoneBuffer.input);
  };

  const turnOffStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      // queue.splice(0);
    }
    setStream(undefined);
  };

  const switchMic = (deviceId: string) => {
    turnOffStream();
    setMicId(deviceId);
  };

  return (
    <div className="App">
      <header className="App-header">
        {supported === undefined && (
          <>
            <p>Checking browser for Audio APIs</p>
          </>
        )}
        {supported === true && (
          <>
            <div>
              <div>
                {devices.length === 0 && (
                  <Button onClick={getMicrophones}>
                    Detect available devices
                  </Button>
                )}
              </div>
            </div>
            {devices.length > 0 && (
              <Flex gap="2" direction="column">
                <Select.Root onValueChange={switchMic}>
                  <Select.Trigger placeholder="Select input device" />
                  <Select.Content position="popper">
                    {devices.map((inputDevice) => (
                      <Select.Item
                        key={inputDevice.deviceId}
                        value={inputDevice.deviceId}
                      >
                        {inputDevice.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>

                {stream ? (
                  <div>
                    {stream && (
                      <Button onClick={turnOffStream}>Stop testing</Button>
                    )}
                  </div>
                ) : (
                  <div>
                    <Button onClick={start} disabled={micId === undefined}>
                      Test microphone
                    </Button>
                  </div>
                )}
                <Button onClick={getMicrophones}>Refresh devices</Button>
              </Flex>
            )}
          </>
        )}
        {supported === false && <Text>Unsupported</Text>}
      </header>
    </div>
  );
}