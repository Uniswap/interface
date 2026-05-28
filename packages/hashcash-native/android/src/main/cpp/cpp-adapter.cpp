#include <jni.h>
#include "NitroHashcashNativeOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::hashcashnative::initialize(vm);
}
