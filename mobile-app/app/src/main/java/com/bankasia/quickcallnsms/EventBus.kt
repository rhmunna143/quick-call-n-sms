package com.bankasia.quickcallnsms

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow

object EventBus {
    private val _events = MutableSharedFlow<String>(extraBufferCapacity = 64)
    val events = _events.asSharedFlow()

    fun emitEvent(jsonEvent: String) {
        _events.tryEmit(jsonEvent)
    }
}
